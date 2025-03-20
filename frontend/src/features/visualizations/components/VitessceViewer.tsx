import { useCallback, useMemo, useRef, useState } from "react";
import {Vitessce} from 'vitessce';

import { useGetVisualization } from "../api/useVisualizations.ts";
import { Box, Button, Skeleton, Stack } from "@mui/material";
import { useRefDimensions } from "../../../hooks/useRefDimensions.ts";

interface VitessceViewerProps {
    visualizationId: string;
    close: () => void;
    onSave?: (newConf: string) => void;
}

export default function VitessceViewer({visualizationId, close, onSave}: VitessceViewerProps) {
    const readOnly = onSave === undefined

    const visualization = useGetVisualization(visualizationId)

    const [updatedConf, setUpdatedConf] = useState<string | undefined>(undefined)

    const handleSave = useCallback(() => {
        if (onSave && updatedConf) {
            onSave(updatedConf)
        }
        close()
    }, [onSave, updatedConf, close])

    const handleUpdate = useCallback((newConf: string) => {
        setUpdatedConf(JSON.stringify(newConf))
    }, [])
    
    const controlsContainerRef = useRef<HTMLDivElement>(null)
    const controlsContainerDimensions = useRefDimensions(controlsContainerRef)
    const { height: buttonHeight } = controlsContainerDimensions;
    const vitessce = useMemo(() => {
        if (!visualization.data?.conf) {
            return <Skeleton />
        } else {
            const height = `calc(100vh-${buttonHeight}px)`
            return (
                <Box sx={{ width: '100%', height }}>
                    <Vitessce 
                        config={visualization.data?.conf} 
                        height={window.innerHeight - buttonHeight}
                        onConfigChange={handleUpdate}
                    />
                </Box>
            )
        }
    }, [visualization.data?.conf, buttonHeight, handleUpdate])

    return (
        <Stack 
            flexDirection='column' 
            alignItems='center' 
            sx={(theme) => ({ width: '100%', height: '100%', backgroundColor: theme.palette.background.paper })}
        >
            <Stack flexDirection='row' ref={controlsContainerRef}>
                <Button onClick={close}>Close</Button>
                {!readOnly && <Button onClick={handleSave}>Save</Button>}
            </Stack>
            {vitessce}
        </Stack>
        )
}