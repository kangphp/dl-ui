export class Detail {
    detailsColumns = [
	{ header: "No PO External", value: "PurchaseOrderNumber" },
	{ header: "Barang", value: "ProductName" },
	{ header: "Jumlah", value: "Quantity" },
	{ header: "Satuan", value: "UnitPrice" },
	{ header: "Harga Satuan", value: "LineAmount" }
	];

		activate(model) {
			this.model = model || {};
		}
}