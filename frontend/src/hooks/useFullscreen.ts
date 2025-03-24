import { useCallback, useEffect, useState } from "react";

export default function useFullscreen(onChange?: (newState: boolean) => void) {
	const [isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		function onFullscreenChange() {
			if (document.fullscreenElement) {
				setIsFullscreen(true);
				onChange?.(true);
			} else {
				setIsFullscreen(false);
				onChange?.(false);
			}
		}

		document.addEventListener("fullscreenchange", onFullscreenChange);

		return () =>
			document.removeEventListener("fullscreenchange", onFullscreenChange);
	}, [onChange]);

	const close = useCallback(() => {
		document.exitFullscreen();
	}, []);

	return {
		isFullscreen,
		setIsFullscreen,
		close,
	};
}
