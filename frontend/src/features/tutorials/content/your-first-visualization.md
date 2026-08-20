# Your First Visualization

This tutorial will guide you step by step in building your first Gosling visualization within the CVH platform. You will learn about:
* Creating a visualization
* Loading data sources
* Adding a track
* Changing the visual encoding

## Creating a Visualization

Every visualization lives in a workspace. When you enter a new, empty workspace, CVH already creates a Gosling visualization for you, named **Visualization 1**, so you can start right away. You can edit its information, and add tags, via the meatball menu (three dots).

![Visualization meatball menu](visualization-meatball-menu.webp)

To create another visualization, click the **New Visualization** button in the top left. A pop-up window lets you give it a title, a description, author information, and choose Gosling or Vitessce.

![New Visualization pop-up window](new-visualization-modal.webp)

Some terminology to remember: within a visualization, you can add one or multiple views. A view can in turn have one or more tracks. All tracks in the same view share one genomic x-axis, so they stay aligned as you zoom and pan — that shared axis is what makes them a view rather than separate charts. This tutorial builds a single view holding a single track. To combine several views in one visualization, see [Creating a multi-view visualization](/tutorials/creating-a-multi-view-visualization).

## Loading Data Sources

A new workspace has no data sources yet, so the panel in the bottom left starts empty. For this tutorial you will use the built-in examples: click **Example Data Sources**, select **Two Basic Views**, then click **Add Selected Data Sources to Workspace**.

![Example Data Sources modal](example-data-sources.webp)

Three data sources load into the panel.

![Loaded data sources in the Data panel](data-sources-panel.webp)

## Adding a Track

Now that there are data sources in your workspace, you can start building the visualization on the canvas, beginning with a single track. Drag the last source, **HFFc6_H3K4me3.bigwig**, onto the canvas area, which prompts you to drop it to create a visualization track.

![Dragging a bigwig file onto the canvas](drag-bigwig-track.webp)

Gosling picks a default encoding for this file type (bigwig): a `bar` mark. The track spans the whole genome, with the x-axis along the top showing genomic positions and the y-axis showing the values for the peaks. This is your first visualization!

![Bigwig data drawn as a bar track](first-track-rendered.webp)

## Changing the Visual Encoding

Now for the most interesting part: editing the visual encoding and style properties. This is all done in the right side menu.

### Track Templates

To quickly explore other possible visualizations, take a look at the **Track Templates**. First select the track you want to explore templates for by clicking on it. Hovering over the options also previews the rendering. For example, select **Area Chart**.

![Track Templates with Area Chart selected](track-templates-area.webp)

### Visual Mapping

The **Visual Mapping** panel gives you finer-grained control over the encoding, letting you choose the mark and bind data fields to visual channels. The area chart uses the `area` mark with two channels: `x` (bound to the `start` field, giving genomic position) and `y` (bound to `value`, the peak height). To turn it into a heatmap, set `mark` to `rect`, then drag the data fields listed at the top of the panel onto the channel shelves below it: `start` → `x`, `end` → `xe`, and `value` → `color`. A `rect` mark needs both a left and a right edge, which is why the heatmap uses `xe` where the area chart did not.

![Visual Mapping panel set to a heatmap encoding](visual-mapping-heatmap.webp)

More information about these channels is available in the [Gosling grammar reference](https://gosling-lang.org/docs/reference).

### Code Editor

You can also inspect and change the Gosling specification in the **Code Editor**, the last option of the right panel. For example, for the heatmap, you can change the colormap from `grey` to `viridis`. Edits here are not applied as you type — click **Apply Changes** to confirm them.

![Changing the colormap in the Code Editor](code-editor-colormap.webp)

### Format

Some final styling of this track can be done in the **Format** panel, for example adjusting the height to 40px.

![Format panel with the track height set to 40px](format-panel.webp)

Your changes are saved automatically as you work, so there is no Save button.
