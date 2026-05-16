## Manual Verification Notes

### Admin PDF Upload States

- Open `/admin/workshops/:id` as an ADMIN for a workshop without `pdfUrl`.
- Confirm the `PDF & AI Summary` section shows a PDF file input and `Upload PDF for AI Summary`.
- Select a valid PDF under 10MB and upload it.
- Confirm the page shows upload progress or uploading state, then refreshes workshop data after the `202` response.
- Confirm a workshop with `pdfUrl` and `aiSummary = null` shows `Summary is being generated...` with a spinner.
- Confirm a workshop with `aiSummary` shows the summary text and `Replace PDF`.
- Try uploading a non-PDF and confirm a clear error is displayed while the control remains available.

### Student Summary States

- Open `/workshops/:id` as a STUDENT for a workshop with `hasPdf = false` and `aiSummary = null`.
- Confirm no summary card is rendered.
- Open a workshop with `hasPdf = true` and `aiSummary = null`.
- Confirm the summary card shows `Summary processing...`.
- Open a workshop with `aiSummary` set.
- Confirm the summary card renders the generated summary text.
