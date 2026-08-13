# Creating a Multi-View Visualization

After building your first visualization in [Your first visualization](/tutorials/your-first-visualization), you will extend it to include multiple views, making an overview+details visualization that is interactively linked. You will learn about:
* Adding views
* Linking views
* Layout options for tracks and views

## Adding Views

To add another view to a visualization, click **Create a New View** in the middle canvas area.

*TODO screenshot: create-a-new-view.png, the Create a New View button below the existing view.*

Drop the other data sources onto this new view, one by one. When you drop below or above a current track, a thin drop area pops up. If you drop directly onto a track, it will replace or overlay that track instead.

*TODO screenshot: thin-drop-area.png, the thin drop area that appears above or below an existing track.*

## Linking Views

Switch to **Exploration Mode** and you will see that the views are not linked yet: each one zooms and pans independently. Here the second view is zoomed in while the first is unchanged.

*TODO screenshot: views-not-linked.png, the second view zoomed in independently of the first.*

To link them, go back to **Editing Mode** and open the **View Linking** panel on the right side, specifying **VIEW 1** as Source and **VIEW 2** as Target. Back in **Exploration Mode**, the two views now zoom and pan together.

*TODO screenshot: views-linked.png, the two views zooming and panning in coordination.*

The goal, though, was an overview+details visualization. To get there, you make VIEW 1 the overview and give it a brush, and that brush determines the visible genomic region in VIEW 2. Adding a brush to VIEW 1 takes four steps.

**1. Overlay the same data onto the existing track.** Drag the data source from the data sources panel onto the track and click **OVERLAY A TRACK**.

**2. Check the tabs in Visual Mapping.** The panel now shows two tabs, one per track: the existing heatmap (TRACK 1) and the newly overlaid track (TRACK 2), which defaults to a bar chart.

*TODO screenshot: visual-mapping-two-tracks.png, the Visual Mapping panel showing TRACK 1 and TRACK 2 tabs.*

**3. Turn TRACK 2 into the brush.** On the TRACK 2 tab, set the mark to `brush` and delete the `y` channel encoding, which is not needed. Then switch TRACK 1 from the heatmap to a bar chart, since a bar chart reads more clearly underneath a brush.

**4. Point the link at the brush.** In the **View Linking** panel, change Source to **BRUSH 1** and Target to **VIEW 2**.

Now switch to **Exploration Mode** and try the brush: click and drag its start or end to change its range, and click and drag its middle to move it.

*TODO screenshot: brush-linked-overview.png, the finished overview+details visualization with a working brush.*

## Layout Options for Tracks and Views

TODO: Cover the layout options for arranging tracks and views.
