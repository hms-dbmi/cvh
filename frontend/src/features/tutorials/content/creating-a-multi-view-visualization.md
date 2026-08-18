# Creating a Multi-View Visualization

After building your first visualization in [Your first visualization](/tutorials/your-first-visualization), you will extend it to include multiple views, making an overview+details visualization that is interactively linked. You will learn about:
* Adding views
* Linking views

## Adding Views

To add another view to a visualization, click **Create a New View** in the middle canvas area.

![Create a New View button below the existing view](create-a-new-view.webp)
![The empty new view added below the first](new-view-dropzone.webp)

Now drop the other data sources onto this new view, one by one. Start with **HFFc6_H3K4me3.bigwig**, which becomes the first track in VIEW 2. Then add **H3K27ac.multivec** beneath it in the same view: as you drag it below the bigwig track, a thin drop area pops up, and dropping there places the multivec track under the existing one. Take care to aim for that thin area — dropping directly onto a track will replace or overlay that track instead.

![Thin drop area above an existing track](thin-drop-area.webp)

## Linking Views

Switch to **Exploration Mode** and you will see that the views are not linked yet: each one zooms and pans independently. Here the second view is zoomed in while the first is unchanged.

![Second view zoomed in independently of the first](views-not-linked.webp)

To link them, go back to **Editing Mode** and open the **View Linking** panel on the right side, specifying **VIEW 1** as Source and **VIEW 2** as Target. Back in **Exploration Mode**, the two views now zoom and pan together.

![View Linking panel with VIEW 1 as Source and VIEW 2 as Target](view-linking-panel.webp)
![The two views zooming and panning in coordination](views-linked.webp)

The goal, though, was an overview+details visualization. To get there, you make VIEW 1 the overview and give it a brush, and that brush determines the visible genomic region in VIEW 2. Adding a brush to VIEW 1 takes four steps.

**1. Overlay the same data onto the existing track.** Drag **HFFc6_H3K4me3.bigwig** from the data sources panel directly onto the VIEW 1 track — the same file that track already shows. A pop-up asks what to do with the dropped data; click **OVERLAY A TRACK**.

![Pop-up offering OVERLAY A TRACK for the dropped data source](overlay-a-track.webp)

**2. Check the tabs in Visual Mapping.** The panel now shows two tabs, one per track: the existing heatmap (TRACK 1) and the newly overlaid track (TRACK 2), which defaults to a bar chart.

![Visual Mapping panel with TRACK 1 and TRACK 2 tabs](visual-mapping-two-tracks.webp)

**3. Turn TRACK 2 into the brush.** On the TRACK 2 tab, set `mark` to `brush`. A brush is just a draggable rectangle marking a genomic range, so it needs no vertical extent: delete the `y` channel encoding.

![TRACK 2 tab with the mark set to brush and no y channel](overlay-track-2.webp)

Then switch TRACK 1 from the heatmap back to a bar chart, since bars read more clearly underneath a brush than a heatmap does. Set `mark` to `bar` and bind `y` to the `value` field, so peak height is drawn vertically again instead of as color.

![TRACK 1 tab set to a bar mark with y bound to value](overlay-track-1.webp)

**4. Point the link at the brush.** In the **View Linking** panel, change Source to **BRUSH 1** and Target to **VIEW 2**.

Now switch to **Exploration Mode** and try the brush: click and drag its start or end to change its range, and click and drag its middle to move it.

![Finished overview and detail visualization with a working brush](brush-linked-overview.webp)


