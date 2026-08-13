# Your First Visualization

This tutorial will guide you step by step in building your first Gosling visualization within the CVH platform. You will learn about:
* Creating a visualization
* Loading data sources
* Adding a track
* Changing the visual encoding

## Creating a Visualization

Every visualization lives in a workspace. When you enter a new, empty workspace, CVH already creates a Gosling visualization for you, named **Visualization 1**, so you can start right away. You can edit its information, and add tags, via the meatball menu (three dots).

*TODO screenshot: visualization-meatball-menu.png, editing the default Gosling visualization via its meatball menu.*

To create another visualization, click the **New Visualization** button in the top left. A pop-up window lets you give it a title, a description, author information, and choose Gosling or Vitessce.

*TODO screenshot: new-visualization-modal.png, the New Visualization pop-up window.*

Some terminology to remember: within a visualization, you can add one or multiple views. A view can in turn have one or more tracks. This tutorial builds a single view holding a single track. To combine several views in one visualization, see [Creating a multi-view visualization](/tutorials/creating-a-multi-view-visualization).

## Loading Data Sources

A new workspace has no data sources yet, so the panel in the bottom left starts empty. For this tutorial you will use the built-in examples: click **Example Data Sources**, select **Two Basic Views**, then click **Add Selected Data Sources to Workspace**.

*TODO screenshot: example-data-sources.png, the Example Data Sources modal with Two Basic Views selected.*

Three data sources load into the panel.

*TODO screenshot: data-sources-panel.png, the three loaded data sources in the bottom left panel.*

## Adding a Track

Now that there are data sources in your workspace, you can start building the visualization on the canvas, beginning with a single track. Drag the last source, **HFFc6_H3K4me3.bigwig**, onto the canvas area, which prompts you to drop it to create a visualization track.

*TODO screenshot: drag-bigwig-track.png, dragging HFFc6_H3K4me3.bigwig onto the canvas drop zone.*

Gosling picks a default encoding for this file type (bigwig): a `bar` mark. The track spans the whole genome, with the x-axis along the top showing genomic positions and the y-axis showing the values for the peaks. This is your first visualization!

*TODO screenshot: first-track-rendered.png, the bigwig data drawn as a bar track in View 1.*

## Changing the Visual Encoding

Now for the most interesting part: editing the visual encoding and style properties. This is all done in the right side menu.

### Track Templates

To quickly explore other possible visualizations, take a look at the **Track Templates**. First select the track you want to explore templates for by clicking on it. Hovering over the options also previews the rendering. For example, select **Area Chart**.

*TODO screenshot: track-templates-area.png, the track redrawn as an area chart via Track Templates.*

### Visual Mapping

The **Visual Mapping** panel gives you finer grained control over the encoding, letting you select different marks and channels. For the area chart, the mark is `area`, and the channels used are `x` = position and `y` = quantitative value. To change the design to a heatmap, select `mark` = `rect`, `x` = `start`, `xe` = `end`, and `color` = `value`.

*TODO screenshot: visual-mapping-heatmap.png, the Visual Mapping panel set to a heatmap encoding.*

More information about these channels is available in the [Gosling grammar reference](https://gosling-lang.org/docs/reference).

### Code Editor

You can also inspect and change the Gosling specification in the **Code Editor**, the last option of the right panel. For example, for the heatmap, you can change the colormap from `grey` to `viridis`.

*TODO screenshot: code-editor-colormap.png, changing the colormap in the Code Editor.*

### Format

Some final styling of this track can be done in the **Format** panel, for example adjusting the height to 40px.

*TODO screenshot: format-panel.png, the Format panel with the track height set to 40px.*

Your changes are saved automatically as you work, so there is no Save button.
