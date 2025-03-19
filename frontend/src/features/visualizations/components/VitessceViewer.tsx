import { useMemo } from "react";
import {Vitessce} from 'vitessce';

import { useGetVisualization } from "../api/useVisualizations.ts";
import { Button, Skeleton, Stack } from "@mui/material";

interface VitessceViewerProps {
    visualizationId: string;
    close: () => void;
    onSave?: (newConf: string) => void;
}

export default function VitessceViewer({visualizationId, close}: VitessceViewerProps) {
    const visualization = useGetVisualization(visualizationId)
    const vitessce = useMemo(() => {
        if (!visualization.data?.conf) {
            return <Skeleton />
        } else {
            return <Vitessce config={visualization.data?.conf} />
        }
    }, [visualization.data?.conf])
    return (
        <Stack flexDirection='column'>
            <Button onClick={close}>Close</Button>
            {vitessce}
        </Stack>
        )
}