// Minimal main-thread-safe shim for the four NSWindow attributes Electrobun does not expose.
// Everything here hops onto the main queue itself, so the caller (Bun/Cottontail FFI on the
// JS thread) never touches AppKit directly — which SIGTRAPs on modern macOS.
#import <Cocoa/Cocoa.h>
#import <ApplicationServices/ApplicationServices.h>
#import <IOKit/hidsystem/IOHIDLib.h>
#import <Carbon/Carbon.h>

// Not in the public headers, but present at runtime on macOS 13+.
@interface NSWindow (RavenPrivate)
- (void)setHiddenInMissionControl:(BOOL)hidden;
@end

static void on_main(void (^block)(void)) {
	if ([NSThread isMainThread]) block();
	else dispatch_async(dispatch_get_main_queue(), block);
}

// Level 1000 == NSScreenSaverWindowLevel: above the menu bar and above fullscreen apps.
void raven_set_window_level(void *window, long long level) {
	NSWindow *w = (__bridge NSWindow *)window;
	on_main(^{ [w setLevel:(NSWindowLevel)level]; });
}

// CanJoinAllSpaces | Stationary | IgnoresCycle | FullScreenAuxiliary
void raven_set_overlay_collection_behavior(void *window) {
	NSWindow *w = (__bridge NSWindow *)window;
	on_main(^{
		[w setCollectionBehavior:NSWindowCollectionBehaviorCanJoinAllSpaces
			| NSWindowCollectionBehaviorStationary
			| NSWindowCollectionBehaviorIgnoresCycle
			| NSWindowCollectionBehaviorFullScreenAuxiliary];
	});
}

void raven_set_has_shadow(void *window, bool hasShadow) {
	NSWindow *w = (__bridge NSWindow *)window;
	on_main(^{ [w setHasShadow:hasShadow]; });
}

void raven_set_ignores_mouse_events(void *window, bool ignores) {
	NSWindow *w = (__bridge NSWindow *)window;
	on_main(^{ [w setIgnoresMouseEvents:ignores]; });
}

void raven_set_hidden_in_mission_control(void *window, bool hidden) {
	NSWindow *w = (__bridge NSWindow *)window;
	on_main(^{
		if ([w respondsToSelector:@selector(setHiddenInMissionControl:)]) {
			[w setHiddenInMissionControl:hidden];
		}
	});
}

// Read-back helpers so tests can assert what actually landed (reads are main-thread-safe enough
// for these scalar properties, and we only call them from diagnostics).
long long raven_get_window_level(void *window) {
	return (long long)[(__bridge NSWindow *)window level];
}
unsigned long long raven_get_collection_behavior(void *window) {
	return (unsigned long long)[(__bridge NSWindow *)window collectionBehavior];
}

// ---------------------------------------------------------------------------
// Permissions.
//
// Electrobun's GlobalShortcut uses +[NSEvent addGlobalMonitorForEventsMatchingMask:],
// which silently observes nothing unless the process holds Input Monitoring
// (and, for a CGEventTap, Accessibility). Electrobun never checks or prompts,
// so we do it here and fail loudly instead.
// ---------------------------------------------------------------------------

bool raven_ax_is_trusted(void) {
	return AXIsProcessTrusted();
}

// Shows the system "allow this app to control your computer" prompt once.
bool raven_ax_prompt(void) {
	CFStringRef keys[] = { kAXTrustedCheckOptionPrompt };
	CFBooleanRef values[] = { kCFBooleanTrue };
	CFDictionaryRef options = CFDictionaryCreate(kCFAllocatorDefault,
		(const void **)keys, (const void **)values, 1,
		&kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
	bool trusted = AXIsProcessTrustedWithOptions(options);
	CFRelease(options);
	return trusted;
}

// 0 = granted, 1 = denied, 2 = unknown/not yet asked.
int raven_input_monitoring_status(void) {
	return (int)IOHIDCheckAccess(kIOHIDRequestTypeListenEvent);
}

bool raven_input_monitoring_request(void) {
	return IOHIDRequestAccess(kIOHIDRequestTypeListenEvent);
}

// Identity of the running process, so we can tell the user exactly which binary
// to grant, and detect the ad-hoc-signing churn that resets grantson every rebuild.
const char *raven_bundle_identity(void) {
	NSBundle *b = [NSBundle mainBundle];
	NSString *s = [NSString stringWithFormat:@"bundleId=%@ path=%@",
		[b bundleIdentifier] ?: @"(none)", [b bundlePath] ?: @"(none)"];
	return [s UTF8String];
}

// ---------------------------------------------------------------------------
// Permission-free global hotkeys, the way Electron does it.
//
// Electron's globalShortcut does NOT use an NSEvent monitor (which needs Input
// Monitoring) - it uses Carbon RegisterEventHotKey, which needs no TCC grant at
// all and *consumes* the keystroke. Carbon is deprecated but fully functional,
// and it is still what Chromium/Electron ship on macOS.
//
// Two pieces:
//   1. RegisterEventHotKey + an application event handler for kEventHotKeyPressed.
//   2. Layout-aware character -> virtual keyCode resolution via UCKeyTranslate,
//      because RegisterEventHotKey takes *physical* key codes. Registering the
//      QWERTY code for 'a' hits the 'q' position on AZERTY - which is the exact
//      cause of upstream raven issue #2.
// ---------------------------------------------------------------------------

typedef void (*RavenHotkeyCallback)(int hotkeyId);

static RavenHotkeyCallback g_hotkeyCallback = NULL;
static EventHandlerRef g_hotkeyHandler = NULL;
static NSMutableDictionary<NSNumber *, NSValue *> *g_hotkeyRefs = nil;

static OSStatus raven_hotkey_event(EventHandlerCallRef nextHandler, EventRef event, void *userData) {
	(void)nextHandler; (void)userData;
	EventHotKeyID hotKeyID;
	OSStatus status = GetEventParameter(event, kEventParamDirectObject, typeEventHotKeyID,
		NULL, sizeof(hotKeyID), NULL, &hotKeyID);
	if (status == noErr && g_hotkeyCallback) g_hotkeyCallback((int)hotKeyID.id);
	return noErr;
}

bool raven_hotkeys_init(RavenHotkeyCallback callback) {
	g_hotkeyCallback = callback;
	if (g_hotkeyHandler) return true;
	if (!g_hotkeyRefs) g_hotkeyRefs = [NSMutableDictionary dictionary];
	EventTypeSpec spec = { kEventClassKeyboard, kEventHotKeyPressed };
	OSStatus status = InstallEventHandler(GetApplicationEventTarget(), &raven_hotkey_event,
		1, &spec, NULL, &g_hotkeyHandler);
	return status == noErr;
}

// carbonModifiers: cmdKey 0x0100, shiftKey 0x0200, optionKey 0x0800, controlKey 0x1000.
// Pass 0 for a bare key - that is how raven grabs every printable character.
bool raven_register_hotkey(int hotkeyId, unsigned int keyCode, unsigned int carbonModifiers) {
	if (!g_hotkeyHandler) return false;
	if (g_hotkeyRefs[@(hotkeyId)]) return false;
	EventHotKeyID hkID;
	hkID.signature = 'rvn0';
	hkID.id = (UInt32)hotkeyId;
	EventHotKeyRef ref = NULL;
	OSStatus status = RegisterEventHotKey((UInt32)keyCode, (UInt32)carbonModifiers, hkID,
		GetApplicationEventTarget(), 0, &ref);
	if (status != noErr || !ref) return false;
	g_hotkeyRefs[@(hotkeyId)] = [NSValue valueWithPointer:ref];
	return true;
}

bool raven_unregister_hotkey(int hotkeyId) {
	NSValue *boxed = g_hotkeyRefs[@(hotkeyId)];
	if (!boxed) return false;
	UnregisterEventHotKey((EventHotKeyRef)[boxed pointerValue]);
	[g_hotkeyRefs removeObjectForKey:@(hotkeyId)];
	return true;
}

void raven_unregister_all_hotkeys(void) {
	for (NSNumber *key in [g_hotkeyRefs allKeys]) {
		UnregisterEventHotKey((EventHotKeyRef)[g_hotkeyRefs[key] pointerValue]);
	}
	[g_hotkeyRefs removeAllObjects];
}

// Dump the ENTIRE current keyboard layout in one main-thread hop: for every virtual
// key code 0..127, the character it produces unmodified. Returns JSON.
//
// Doing this per-character from the JS thread SIGTRAPs intermittently - TIS and
// LMGetKbdType are not safe off the main thread - so it all happens inside one
// dispatch_sync and the result is cached until the layout changes.
//
// This also replaces raven's hardcoded 93-character QWERTY string: ask the layout
// which keys exist instead of assuming.
static NSString *g_layoutJSON = nil;

static NSString *raven_build_layout_json(void) {
	TISInputSourceRef source = TISCopyCurrentKeyboardLayoutInputSource();
	if (!source) return @"[]";
	CFDataRef layoutData = (CFDataRef)TISGetInputSourceProperty(source, kTISPropertyUnicodeKeyLayoutData);
	if (!layoutData) { CFRelease(source); return @"[]"; }
	const UCKeyboardLayout *layout = (const UCKeyboardLayout *)CFDataGetBytePtr(layoutData);
	UInt32 kbdType = LMGetKbdType();

	NSMutableArray *entries = [NSMutableArray array];
	for (UInt16 code = 0; code < 128; code++) {
		UInt32 deadKeyState = 0;
		UniChar chars[8] = {0};
		UniCharCount len = 0;
		OSStatus status = UCKeyTranslate(layout, code, kUCKeyActionDown, 0, kbdType,
			kUCKeyTranslateNoDeadKeysMask, &deadKeyState, 8, &len, chars);
		if (status != noErr || len != 1) continue;
		NSString *produced = [NSString stringWithCharacters:chars length:len];
		unichar u = [produced characterAtIndex:0];
		if (u < 0x20 || u == 0x7F) continue; // printable only
		NSData *json = [NSJSONSerialization dataWithJSONObject:@[produced] options:0 error:nil];
		if (!json) continue;
		NSString *quoted = [[NSString alloc] initWithData:json encoding:NSUTF8StringEncoding];
		quoted = [quoted substringWithRange:NSMakeRange(1, quoted.length - 2)]; // strip [ ]
		[entries addObject:[NSString stringWithFormat:@"{\"code\":%d,\"ch\":%@}", code, quoted]];
	}
	CFRelease(source);
	return [NSString stringWithFormat:@"[%@]", [entries componentsJoinedByString:@","]];
}

const char *raven_layout_table_json(void) {
	__block NSString *result = nil;
	void (^work)(void) = ^{
		if (!g_layoutJSON) g_layoutJSON = raven_build_layout_json();
		result = g_layoutJSON;
	};
	if ([NSThread isMainThread]) work();
	else dispatch_sync(dispatch_get_main_queue(), work);
	return [result UTF8String];
}

void raven_invalidate_layout_table(void) {
	on_main(^{ g_layoutJSON = nil; });
}

// Full NSWindow state dump, read on the main thread. Electrobun's own is* getters
// SIGTRAP (synchronous main-thread hop), so this is how we inspect a window safely.
const char *raven_window_debug_json(void *window) {
	NSWindow *w = (__bridge NSWindow *)window;
	__block NSString *out = nil;
	void (^work)(void) = ^{
		NSRect f = [w frame];
		NSScreen *scr = [w screen];
		NSRect sf = scr ? [scr frame] : NSMakeRect(0, 0, 0, 0);
		out = [NSString stringWithFormat:
			@"{\"isVisible\":%d,\"alphaValue\":%.3f,\"isOpaque\":%d,\"level\":%ld,"
			 "\"frame\":[%.0f,%.0f,%.0f,%.0f],\"occlusionVisible\":%d,"
			 "\"isOnActiveSpace\":%d,\"isMiniaturized\":%d,\"hasShadow\":%d,"
			 "\"ignoresMouseEvents\":%d,\"collectionBehavior\":%lu,"
			 "\"screen\":%@,\"screenFrame\":[%.0f,%.0f,%.0f,%.0f],"
			 "\"contentViewClass\":\"%@\",\"subviewCount\":%lu,"
			 "\"backgroundColorAlpha\":%.3f}",
			[w isVisible], [w alphaValue], [w isOpaque], (long)[w level],
			f.origin.x, f.origin.y, f.size.width, f.size.height,
			([w occlusionState] & NSWindowOcclusionStateVisible) ? 1 : 0,
			[w isOnActiveSpace], [w isMiniaturized], [w hasShadow],
			[w ignoresMouseEvents], (unsigned long)[w collectionBehavior],
			scr ? @"true" : @"null",
			sf.origin.x, sf.origin.y, sf.size.width, sf.size.height,
			NSStringFromClass([[w contentView] class]),
			(unsigned long)[[[w contentView] subviews] count],
			[[w backgroundColor] alphaComponent]];
	};
	if ([NSThread isMainThread]) work(); else dispatch_sync(dispatch_get_main_queue(), work);
	return [out UTF8String];
}

// Force the window visible and frontmost, bypassing whatever Electrobun did.
void raven_force_show(void *window) {
	NSWindow *w = (__bridge NSWindow *)window;
	on_main(^{
		[w setAlphaValue:1.0];
		[w orderFrontRegardless];
	});
}

// Walk the window's view tree with layer state. This is how we find a webview that
// renders (JS runs, canvas has pixels) but never reaches the screen.
static void raven_dump_view(NSView *v, int depth, NSMutableArray *out) {
	CALayer *l = [v layer];
	[out addObject:[NSString stringWithFormat:
		@"{\"depth\":%d,\"class\":\"%@\",\"frame\":[%.0f,%.0f,%.0f,%.0f],"
		 "\"hidden\":%d,\"alpha\":%.2f,\"opaque\":%d,\"wantsLayer\":%d,"
		 "\"layer\":%@,\"layerOpacity\":%.2f,\"layerHidden\":%d,"
		 "\"layerBounds\":[%.0f,%.0f],\"sublayers\":%lu,\"subviews\":%lu}",
		depth, NSStringFromClass([v class]),
		v.frame.origin.x, v.frame.origin.y, v.frame.size.width, v.frame.size.height,
		[v isHidden], [v alphaValue], [v isOpaque], [v wantsLayer],
		l ? @"true" : @"null", l ? l.opacity : -1.0f, l ? [l isHidden] : 0,
		l ? l.bounds.size.width : 0, l ? l.bounds.size.height : 0,
		l ? (unsigned long)[[l sublayers] count] : 0,
		(unsigned long)[[v subviews] count]]];
	for (NSView *sub in [v subviews]) raven_dump_view(sub, depth + 1, out);
}

const char *raven_view_tree_json(void *window) {
	NSWindow *w = (__bridge NSWindow *)window;
	__block NSString *out = nil;
	void (^work)(void) = ^{
		NSMutableArray *rows = [NSMutableArray array];
		raven_dump_view([w contentView], 0, rows);
		out = [NSString stringWithFormat:@"[%@]", [rows componentsJoinedByString:@","]];
	};
	if ([NSThread isMainThread]) work(); else dispatch_sync(dispatch_get_main_queue(), work);
	return [out UTF8String];
}

// ---------------------------------------------------------------------------
// Showing over ANOTHER app's fullscreen space.
//
// Since macOS 10.14, NSWindowCollectionBehaviorCanJoinAllSpaces is ignored when
// NSWindowCollectionBehaviorFullScreenAuxiliary is also set - unless the process
// is a UIElement application. Electron works around this in
// NativeWindowMac::SetVisibleOnAllWorkspaces by calling the Carbon
// TransformProcessType and setCanHide:NO. -[NSApp setActivationPolicy:Accessory]
// is NOT equivalent and is not sufficient.
// ---------------------------------------------------------------------------

bool raven_become_ui_element_app(void) {
	__block bool ok = false;
	void (^work)(void) = ^{
		ProcessSerialNumber psn = { 0, kCurrentProcess };
		ok = (TransformProcessType(&psn, kProcessTransformToUIElementApplication) == noErr);
	};
	if ([NSThread isMainThread]) work(); else dispatch_sync(dispatch_get_main_queue(), work);
	return ok;
}

// Everything a raven overlay window needs, applied in Electron's order.
void raven_configure_overlay_window(void *window) {
	NSWindow *w = (__bridge NSWindow *)window;
	on_main(^{
		[w setCanHide:NO];
		[w setCollectionBehavior:NSWindowCollectionBehaviorCanJoinAllSpaces
			| NSWindowCollectionBehaviorFullScreenAuxiliary
			| NSWindowCollectionBehaviorStationary
			| NSWindowCollectionBehaviorIgnoresCycle];
		[w setLevel:NSScreenSaverWindowLevel];
		[w setHasShadow:NO];
		[w setIgnoresMouseEvents:YES];
		if ([w respondsToSelector:@selector(setHiddenInMissionControl:)]) {
			[w setHiddenInMissionControl:YES];
		}
		[w orderFrontRegardless];
	});
}

bool raven_get_can_hide(void *window) {
	return [(__bridge NSWindow *)window canHide];
}

int raven_activation_policy(void) {
	return (int)[[NSApplication sharedApplication] activationPolicy];
}
