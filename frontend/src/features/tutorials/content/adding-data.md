# Adding Data

## Supported Formats

The Community Visualization Hub supports all data types and file formats compatible with Vitessce and Gosling. To learn more about the specific data types supported by each platform, please consult their official documentation:

- **Vitessce**: View the [Vitessce Data Types & File Types Documentation](https://vitessce.io/docs/data-types-file-types/)
- **Gosling**: View the [Gosling Data Documentation](https://gosling-lang.org/docs/data)

Some data sources require additional configuration after upload and will not be available for use immediately. If your data requires this step a yellow Processing Needed button will appear next to the data source. Click the Processing Needed button to start processing your data. Once processing is complete, your data will be fully ready for use in your visualizations.

## Data Panel

The Data Panel displays all the datasets available to you and your collaborators within your workspace. You can populate your Data Panel by uploading your own files using the Add Data Source button, or by opening the Browse Library modal to explore and add datasets directly from various Data Coordinating Centers.

![Data Panel — empty and populated](%CLOUDFRONT_URL%/tutorials/data-panel.png)

Once datasets are in your workspace, the panel displays key information for each file—including its **name**, **data type**, **assembly**, and associated **tags**. Clicking the **meatball menu** (three horizontal dots) next to any dataset allows you to edit its details, as well as create and assign unique tags to help with filtering.

## Browsing for Data in Data Library

You can access the Data Library by clicking the Browse Library button inside the Data Panel. Clicking this button opens a modal where you can choose between two supported Data Coordinating Centers (DCCs): 4DN and ENCODE.

Once you select a DCC, a preview table will display the available datasets. To find what you need, you can filter the table by assembly and file type, or use the Dataset ID lookup to jump directly to a specific dataset of interest. Inside the table, check the boxes next to the data sources you want, and click to add them directly to your workspace.

![Data Library modal](%CLOUDFRONT_URL%/tutorials/data-library.png)

**Tip**: For more advanced filtering and complex search queries, we recommend visiting the DCC's website directly which is also linked in the Quick Lookup accordion.

## Uploading Local Data

The Community Visualization Hub currently does not host data files directly. Your data must be hosted externally with a publicly accessible link.

To add your own dataset, click the **Add Data Source** button in the Data Panel to open the setup modal. You will start by selecting the file type for your data. From there, fill in the core file information—including the source URL, index URL (if required), and a recognizable data source name—before defining the genome assembly and providing any other necessary supporting details.

![Choosing a file type and adding data source information](%CLOUDFRONT_URL%/tutorials/add-data-source.png)

Once you click **Submit**, provided all information is accurate, your new dataset will immediately appear in your workspace's Data Panel and be ready for use.
