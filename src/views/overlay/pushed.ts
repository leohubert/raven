import type { PushedAsset } from "../../overlay/types";

type UrlFactory = {
	createObjectURL: (blob: Blob) => string;
	revokeObjectURL: (url: string) => void;
};

/**
 * The blob URLs of the theme currently pushed to this client, keyed by `rel`.
 *
 * Assets that arrive at runtime cannot be served over `views://` - that scheme only reaches
 * paths baked into the signed bundle at build time - so they are handed to the webview as
 * base64 and turned into blobs here. Resolution happens where a URL is used rather than by
 * rewriting the theme once, because bursts keep arriving from the main process afterwards,
 * each carrying the asset's original `pushed://` URL.
 */
export function newPushedAssets(urls: UrlFactory = URL) {
	let byRel = new Map<string, string>();

	function adopt(assets: PushedAsset[]): void {
		for (const url of byRel.values()) urls.revokeObjectURL(url);
		byRel = new Map(
			assets.map((asset) => {
				const bytes = Uint8Array.from(atob(asset.base64), (c) => c.charCodeAt(0));
				return [asset.rel, urls.createObjectURL(new Blob([bytes], { type: asset.mime }))];
			}),
		);
	}

	return {
		adopt,
		resolve: (asset: { rel: string; url: string }): string => byRel.get(asset.rel) ?? asset.url,
	};
}
