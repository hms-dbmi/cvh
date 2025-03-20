import { useMemo, useRef } from "react";
import {Vitessce} from 'vitessce';

import { useGetVisualization } from "../api/useVisualizations.ts";
import { Box, Button, Skeleton, Stack } from "@mui/material";
import { useRefDimensions } from "../../../hooks/useRefDimensions.ts";

interface VitessceViewerProps {
    visualizationId: string;
    close: () => void;
    onSave?: (newConf: string) => void;
}



export default function VitessceViewer({visualizationId, close}: VitessceViewerProps) {
    const visualization = useGetVisualization(visualizationId)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const buttonDimensions = useRefDimensions(buttonRef)
    const { height: buttonHeight } = buttonDimensions;
    const vitessce = useMemo(() => {
        if (!visualization.data?.conf) {
            return <Skeleton />
        } else {
            const height = `calc(100vh-${buttonHeight}px)`
            return (
                <Box sx={{ width: '100%', height }}>
                    <Vitessce 
                        config={visualization.data?.conf} 
                        height={window.innerHeight - buttonHeight} />
                </Box>
            )
        }
    }, [visualization.data?.conf, buttonHeight])
    return (
        <Stack 
            flexDirection='column' 
            alignItems='center' 
            sx={(theme) => ({ width: '100%', height: '100%', backgroundColor: theme.palette.background.paper })}
        >
            <Button ref={buttonRef} onClick={close}>Close</Button>
            {vitessce}
        </Stack>
        )
}