import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { LinkSimple } from "@phosphor-icons/react";
import { memo, useLayoutEffect, useRef, useState } from "react";
import {
  type CfdbFile,
  firstCollectionWithField,
  getFileAccession,
} from "../../../api/cfdb";

// The Data Library's file table, shared by Browse and Explore's file selection.
export function FileTableHead({
  selectableCount,
  selectedCount,
  onToggleAll,
}: {
  selectableCount: number;
  selectedCount: number;
  onToggleAll: () => void;
}) {
  return (
    <TableHead>
      <TableRow
        sx={{
          bgcolor: "#F5F7FA",
          "& th": {
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "#4E5A63",
            whiteSpace: "nowrap",
          },
        }}
      >
        <TableCell padding="checkbox">
          <Checkbox
            size="small"
            disabled={selectableCount === 0}
            checked={selectableCount > 0 && selectedCount === selectableCount}
            indeterminate={selectedCount > 0 && selectedCount < selectableCount}
            onChange={onToggleAll}
          />
        </TableCell>
        <TableCell>Dataset Name</TableCell>
        <TableCell>Type</TableCell>
        <TableCell>Assay Type</TableCell>
        <TableCell>Assay Target</TableCell>
        <TableCell>Assembly</TableCell>
        <TableCell>Collections</TableCell>
        <TableCell sx={{ minWidth: 300 }}>Description</TableCell>
      </TableRow>
    </TableHead>
  );
}

// `React.memo` so toggling one checkbox doesn't re-render thousands of
// rows. The parent passes a stable `onToggle` (useCallback) and the `file`
// reference is stable across renders (React Query keeps the array identity
// stable while the query is fresh), so a default shallow compare works.
export const DatasetRow = memo(function DatasetRow({
  file,
  selected,
  disabled,
  expanded,
  onToggle,
  onToggleExpanded,
  measureRef,
  dataIndex,
}: {
  file: CfdbFile;
  selected: boolean;
  disabled: boolean;
  expanded: boolean;
  onToggle: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  measureRef: (el: HTMLElement | null) => void;
  dataIndex: number;
}) {
  const assayTarget = firstCollectionWithField(file, "experimentTarget");
  const description = firstCollectionWithField(file, "description");
  const collections = file.collections ?? [];

  const CELL_TEXT_SX = { fontSize: 14, color: "#4E5A63" } as const;

  // Detect whether the clamped description is actually being cut off.
  // If everything fits in two lines there's nothing to expand, so we
  // suppress the "Show More" affordance. Only re-measure in the
  // collapsed state — when expanded the clamp is off and heights match
  // by definition.
  const descRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  useLayoutEffect(() => {
    if (expanded) return;
    const el = descRef.current;
    if (!el) return;
    setIsOverflowing(el.scrollHeight > el.clientHeight);
  }, [description, expanded]);

  return (
    <TableRow hover ref={measureRef} data-index={dataIndex}>
      <TableCell padding="checkbox">
        <Checkbox
          size="small"
          checked={selected}
          disabled={disabled}
          onChange={() => onToggle(file.localId)}
        />
      </TableCell>
      <TableCell>
        <Stack sx={{ gap: "5px" }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1.2,
              color: "#010101",
            }}
          >
            {file.filename}
          </Typography>
          {(() => {
            const accession = getFileAccession(file);
            return file.persistentId ? (
              <Typography
                component="a"
                href={file.persistentId}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${accession} on ${file.dcc.dccName}`}
                // Stop the click from bubbling to the row (which would
                // toggle the checkbox); the accession is a link, not a
                // selection affordance.
                onClick={(e) => e.stopPropagation()}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: 12,
                  fontWeight: 400,
                  lineHeight: 1.2,
                  color: "#010101",
                  textDecoration: "underline",
                  "&:hover": { color: "#4E5A63" },
                }}
              >
                {accession}
                <LinkSimple size={14} style={{ flexShrink: 0 }} />
              </Typography>
            ) : (
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 400,
                  lineHeight: 1.2,
                  color: "#010101",
                }}
              >
                {accession}
              </Typography>
            );
          })()}
        </Stack>
      </TableCell>
      <TableCell>
        <Typography sx={CELL_TEXT_SX}>
          {file.fileFormat?.name ?? "—"}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography sx={CELL_TEXT_SX}>{file.assayType?.name ?? "—"}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={CELL_TEXT_SX}>{assayTarget ?? "—"}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={CELL_TEXT_SX}>{file.genomeAssembly ?? "—"}</Typography>
      </TableCell>
      <TableCell>
        {collections.length === 0 ? (
          <Typography sx={CELL_TEXT_SX}>—</Typography>
        ) : (
          <Typography sx={CELL_TEXT_SX}>
            {collections.map((c, i) => {
              const label = c.abbreviation || c.name || c.localId;
              return (
                <span key={c.localId}>
                  {i > 0 && ", "}
                  {c.persistentId ? (
                    <Typography
                      component="a"
                      href={c.persistentId}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        ...CELL_TEXT_SX,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.25,
                        textDecoration: "underline",
                        "&:hover": { color: "#010101" },
                      }}
                    >
                      {label}
                      <LinkSimple size={14} style={{ flexShrink: 0 }} />
                    </Typography>
                  ) : (
                    label
                  )}
                </span>
              );
            })}
          </Typography>
        )}
      </TableCell>
      <TableCell sx={{ minWidth: 300, maxWidth: 400 }}>
        {description ? (
          <>
            <Typography
              ref={descRef}
              sx={{
                ...CELL_TEXT_SX,
                display: "-webkit-box",
                WebkitLineClamp: expanded ? "unset" : 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {description}
            </Typography>
            {(isOverflowing || expanded) && (
              <Typography
                component="button"
                onClick={() => onToggleExpanded(file.localId)}
                sx={{
                  mt: 0.5,
                  background: "none",
                  border: "none",
                  p: 0,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#010101",
                  textDecoration: "underline",
                }}
              >
                {expanded ? "Show Less" : "Show More"}
              </Typography>
            )}
          </>
        ) : (
          <Typography sx={CELL_TEXT_SX}>—</Typography>
        )}
      </TableCell>
    </TableRow>
  );
});
