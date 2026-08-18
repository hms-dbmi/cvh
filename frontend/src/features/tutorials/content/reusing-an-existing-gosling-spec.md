# Reusing an Existing Gosling Spec

You do not have to build every visualization from scratch. Any Gosling specification — from the official example gallery, a published paper, or a colleague — can be pasted straight into CVH and edited there. This tutorial copies the Circos example from the Gosling gallery, pastes it into a new visualization, and then turns it from a circular into a linear layout and recolors its outer ring. You will learn about:
* Copying a spec from the Gosling gallery into a new visualization
* Editing a pasted spec

## Copying a Spec from the Gallery

The [Gosling example gallery](https://gosling-lang.org/examples) collects ready-made visualizations, each with its full specification. Open the [Circos example](https://gosling.js.org/?example=CIRCOS) in the online editor: it stacks several tracks on concentric rings, with a bar chart on the outermost ring and chords drawn across the middle.

Select the whole specification in the editor pane and copy it. The spec is self-contained: its data URLs point at publicly hosted files, so it will render in CVH without any changes to the data sources.

![The Circos example in the Gosling online editor](%CLOUDFRONT_URL%/tutorials/gallery-circos-example.png)

## Pasting the Spec into a Visualization

Back in your CVH workspace, click **New Visualization** in the top left, give it a title, and choose **Gosling**.

Open the **Code Editor** in the right side panel. Before you paste anything, check that no track is selected: the Code Editor scopes to whatever is selected, so with a track active you would be editing that track's spec rather than the whole visualization. This is easy to overlook, and it is the most common reason a pasted spec does not render.

With the editor scoped to the whole visualization, select the starter specification that is already there and replace it by pasting in the spec you copied. Then delete the spec's `title` property, which does not currently render correctly in CVH. Click **Apply Changes** to confirm, and the Circos visualization appears on the canvas.

![The pasted Circos spec rendered on the canvas](%CLOUDFRONT_URL%/tutorials/pasted-circos-spec.png)

Because the spec brought its own data URLs with it, nothing needed to be added to the Data panel. If a spec you paste points at data that is not publicly reachable, you will need to add that file as a data source in your workspace first, and then update the spec's `data.url` to match.

## Editing the Pasted Spec

Now you can start editing this spec. A pasted spec is not frozen: the specification is fully editable in CVH, and you can work on it through the Code Editor or the panels on the right. CVH is still in beta, so not every editing feature works on a pasted spec yet — but the two edits below show what editing one looks like.

**Unroll the circle.** Layout is set from the canvas rather than a side panel. On the left of the view title (**VIEW 1**) and its genomic range are three layout buttons: linear, circular, and 3D — the last applies only to data types that support it. Click the first button to switch this view to a linear layout. The same tracks are now drawn as horizontal rows stacked on top of each other, and the chords that ran across the circle become arcs. Nothing else has to change: layout is a property of the view, not of the individual tracks.
![The same spec with the layout switched to linear](%CLOUDFRONT_URL%/tutorials/circos-linear-layout.png)

**Change the encoding of the outer track.** Click the outermost track to select it, open the **Visual Mapping** panel, and change its `mark` from `bar` to `point`. The track redraws as points while the rest of the visualization stays as it was.

![The outer track's mark changed from bar to point in the Visual Mapping panel](%CLOUDFRONT_URL%/tutorials/circos-outer-track-point.png)

This tutorial showed how an existing Gosling spec can be a starting point for your own visualization.
