import List from "@mui/material/List";
import Stack from "@mui/material/Stack";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type PropsWithChildren, useEffect, useRef } from "react";

interface InfiniteScrollListProps<T extends { uuid: string }> {
	count: number;
	estimateSize: () => number;
	overscan: number;
	items: T[];
	loadMoreItems?: () => void;
	hasMoreItems?: boolean;
	isLoading?: boolean;
	isError?: boolean;
	ListItem: (item: T) => React.ReactNode;
	LoadingIndicator?: React.FC;
	NoMoreItemsIndicator?: React.FC;
	Header?: React.ReactNode;
	Footer?: React.ReactNode;
	listHeight?: number;
}

export default function InfiniteScrollList<T extends { uuid: string }>({
	count,
	estimateSize,
	overscan,
	items,
	loadMoreItems,
	hasMoreItems,
	isLoading,
	isError,
	ListItem,
	LoadingIndicator = () => <div>Loading...</div>,
	NoMoreItemsIndicator = () => <div>No more items to load</div>,
	Header,
	Footer,
	listHeight = 500,
}: InfiniteScrollListProps<T>) {
	const parentRef = useRef<HTMLDivElement>(null);
	const virtualizer = useVirtualizer({
		count,
		getScrollElement: () => parentRef.current,
		estimateSize,
		overscan,
	});

	useEffect(() => {
		// Cancel loading more items if there are no more items to load, if already loading more items, or if there is an error
		if (
			!hasMoreItems ||
			isLoading ||
			isError ||
			!loadMoreItems ||
			!parentRef.current
		)
			return;

		// Load more items when the last item in the virtualizer is visible
		const lastItem = virtualizer.getVirtualItems().slice(-1)[0];
		const scrollLocation =
			parentRef.current.scrollTop + parentRef.current.scrollHeight || 0;

		if (lastItem.start < scrollLocation) {
			loadMoreItems();
		}
	}, [
		virtualizer,
		hasMoreItems,
		isLoading,
		isError,
		loadMoreItems,
		items.length,
	]);

	return (
		<Stack width={500}>
			{Header}
			<div ref={parentRef} style={{ height: listHeight, overflowY: "auto" }}>
				<List>
					{virtualizer.getVirtualItems().map((virtualRow) => {
						const isLoaderRow = virtualRow.index > items.length - 1;
						const currentItem = items[virtualRow.index];
						if (!currentItem && isLoaderRow) {
							return (
								<VirtualRow
									key="loader-row"
									height={virtualRow.size}
									start={virtualRow.start}
								>
									{isLoading ? <LoadingIndicator /> : <NoMoreItemsIndicator />}
								</VirtualRow>
							);
						}
						return (
							<VirtualRow
								key={currentItem.uuid}
								height={virtualRow.size}
								start={virtualRow.start}
							>
								{currentItem && ListItem(currentItem)}
							</VirtualRow>
						);
					})}
				</List>
			</div>
			{Footer}
		</Stack>
	);
}

function VirtualRow({
	height,
	start,
	children,
}: PropsWithChildren<{ height: number; start: number }>) {
	return (
		<div
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: `${height}px`,
				transform: `translateY(${start}px)`,
			}}
		>
			{children}
		</div>
	);
}
