import { inject, computedFrom } from "aurelia-framework";
import { Router } from "aurelia-router";

@inject(Router)
export class View {
  static DEFAULT_DATE = "1900-01-01T12:00:00";

  tableOptions = {
    pagination: false,
    showColumns: false,
    search: false,
    showToggle: false,
    striped: false,
    sortable: false,
    searchOnEnterKey: false,
    showRefresh: false,
    smartDisplay: false,
  };

  hasCancel = true;
  data = null;
  id = null;
  controlOptions = {};

  showItemsTable = false;
  itemsData = [];
  itemsColumns = [
    { header: "Nama Barang", value: "itemName" },
    { header: "Qty", value: "quantity" },
    { header: "Harga Satuan", value: "unitPrice" },
  ];

  showURNsTable = false;
  urnsData = [];
  urnsColumns = [
    {
      field: "URNNo",
      title: "Nomor Bon Unit",
      formatter: (value, row) => (row && row.message ? row.message : value),
    },
    {
      field: "ItemName",
      title: "Nama Barang",
      sortable: true,
    },
    {
      field: "Quantity",
      title: "Jumlah",
      formatter: (value) => this.formatNumber(value),
      sortable: true,
    },
  ];

  // showInvoiceTable = false;
  // invoiceData = [];
  // invoiceColumns = [
  //   {
  //     field: "invoiceNo",
  //     title: "Nomor Invoice",
  //     formatter: (value, row) => (row && row.message ? row.message : value),
  //   },
  // ];

  showPRsTable = false;
  prsData = [];
  prsColumns = [
    {
      field: "PurchaseRequestNo",
      title: "Nomor Purchase Request",
      formatter: (value, row) => (row && row.message ? row.message : value),
    },
    {
      field: "ItemName",
      title: "Nama Barang",
      formatter: (value, row) => (row && row.message ? row.message : value),
    },
  ];

  showPOsTable = false;
  posData = [];
  posColumns = [
    {
      field: "PurchaseOrderNumber",
      title: "Nomor PO",
    },
    {
      field: "GrandTotalAfterTax",
      title: "Grand Total",
      formatter: (value) => this.formatNumber(value),
    },
    {
      field: "actions",
      title: "",
      formatter: (value, row) =>
        `<button class="btn btn-info btn-sm" data-index="${row._poIndex}" onclick="window.showPODetail && window.showPODetail(event)"><i class="fa fa-info"></i></button>`,
    },
  ];

  // showTaxTable = false;
  // taxData = [];
  // taxColumns = [
  //   { field: "TaxInvoiceNumber", title: "No. Faktur Pajak" },
  //   {
  //     field: "TaxInvoiceDateOffset",
  //     title: "Tanggal Faktur",
  //     formatter: (v) => this.formatDate(v),
  //   },
  //   {
  //     field: "ValueAddedTax",
  //     title: "PPN",
  //     align: "right",
  //     formatter: (v) => this.formatNumber(v),
  //   },
  // ];

  attached() {
    window.showPODetail = (e) => {
      const idx = e.target.getAttribute("data-index");
      this.showPOItems(idx);
    };
  }

  showPOItemsTable = false;
  poItemsData = [];
  poItemsColumns = [
    { field: "ItemName", title: "Nama Barang" },
    { field: "Quantity", title: "Qty" },
    {
      field: "UnitPrice",
      title: "Harga Satuan",
      formatter: (value) => this.formatNumber(value),
    },
  ];

  constructor(router) {
    this.router = router;

    this.actionFormatter = (value, row) =>
      `<button type="button" class="btn btn-primary btn-sm" data-action="info" data-id="${row.Id}">i</button>`;

    //this.onTableClick = this.onTableClick.bind(this);

    this.urnTableOptions = {
      ...this.tableOptions,
      formatNoMatches: () => "Data sudah sesuai",
    };

    // this.invoiceTableOptions = {
    //   ...this.tableOptions,
    //   formatNoMatches: () => "Data sudah sesuai",
    // };

    this.prTableOptions = {
      ...this.tableOptions,
      formatNoMatches: () => "Data sudah sesuai",
    };

    this.poTableOptions = {
      ...this.tableOptions,
      formatNoMatches: () => "Data sudah sesuai",
    };

    // this.taxTableOptions = {
    //   ...this.tableOptions,
    //   formatNoMatches: () => "Data sudah sesuai",
    // };
  }

  /**
   * Handle click events on table rows
   * @param {Event} event
   */
  onTableClick(event) {
    const target = event.target;
    const action = target.getAttribute("data-action");

    if (action === "info") {
      const id = target.getAttribute("data-id");
      this.showItemsTable = !this.showItemsTable;

      // Populate items data if available
      if (this.data && this.data.items && Array.isArray(this.data.items)) {
        this.itemsData = this.data.items;
      }
    }
  }

  formatNumber(value) {
    if (value == null || value === "") return "0";
    const num =
      typeof value === "string" ? Number(value.replace(/,/g, "")) : value;
    if (isNaN(num)) return value;
    return num.toLocaleString("id-ID");
  }

  /**
   * Navigate back to list
   * @param {Event} event
   */
  cancel(event) {
    this.router.navigateToRoute("list");
  }

  /**
   * @returns {Object}
   */

  @computedFrom("data")
  get totalAmount() {
    const safeData = this.safeData;
    if (!safeData || !Array.isArray(safeData.items)) return 0;

    const sumPriceTotal = safeData.items.reduce((sum, item) => {
      if (
        item &&
        item.unitReceiptNote &&
        Array.isArray(item.unitReceiptNote.items)
      ) {
        return (
          sum +
          item.unitReceiptNote.items.reduce((itemSum, subItem) => {
            const price =
              subItem && typeof subItem.PriceTotal === "number"
                ? subItem.PriceTotal
                : 0;
            return itemSum + price;
          }, 0)
        );
      }
      return sum;
    }, 0);

    const ppn = safeData.totalVatAmount || 0;
    const pph = safeData.totalIncomeTaxAmount || 0;
    const total = sumPriceTotal + ppn + pph;

    return total;
  }

  get safeData() {
    return this.data || {};
  }

  @computedFrom("totalAmount", "safeData.totalAmount")
  get highlightDifferencesTotal() {
    const total = this.totalAmount;
    const scanTotal = this.safeData.totalSPbScanResult || 0;
    const isDifferent = total !== scanTotal;
    console.log("[View] highlightDifferencesTotal:", {
      total,
      scanTotal,
      isDifferent,
    });
    return isDifferent;
  }

  @computedFrom("safeData.unitReceiptNotes", "safeData.unitReceiptNotes.length")
  get filteredURNs() {
    const { urns } = this.safeData;
    if (!urns || !Array.isArray(urns)) {
      return [];
    }
    return urns.filter((urn) => urn && urn.URNNo);
  }

  @computedFrom("safeData.invoices", "safeData.invoices.length")
  get filteredInvoices() {
    const { invoices } = this.safeData;
    if (!invoices || !Array.isArray(invoices)) {
      return [];
    }
    return invoices.filter((invoice) => invoice && invoice.invoiceNo);
  }

  @computedFrom("safeData.purchaseRequests", "safeData.purchaseRequests.length")
  get filteredPRs() {
    const { purchaseRequests } = this.safeData;
    if (!purchaseRequests || !Array.isArray(purchaseRequests)) {
      return [];
    }
    return purchaseRequests
      .map((pr) => ({
        ...pr,
        _isDifferent:
          pr.PurchaseRequestNumber !==
          (pr.PurchaseRequestNumberScanResult || pr.PurchaseRequestNumber),
      }))
      .filter(
        (pr) =>
          pr &&
          typeof pr.PurchaseRequestNumber === "string" &&
          pr.PurchaseRequestNumber.trim() !== ""
      );
  }

  @computedFrom("safeData.pos", "safeData.pos.length")
  get filteredPOs() {
    if (!this.data.PurchaseOrder || !Array.isArray(this.data.PurchaseOrder.POs))
      return [];

    return this.data.PurchaseOrder.POs.map((po, idx) => ({
      ...po.POHeader,
      _poIndex: idx,
      _POItems: po.POItems || [],
      _isDifferent:
        po.POHeader.PurchaseOrderNumber !==
        (po.POHeader.PurchaseOrderNumberScanResult ||
          po.POHeader.PurchaseOrderNumber),
    }));
  }

  // @computedFrom("safeData.tax", "safeData.tax.length")
  // get filteredTax() {
  //   const { tax } = this.safeData;
  //   if (!tax || !Array.isArray(tax)) {
  //     return [];
  //   }
  //   return tax.filter((t) => t && t.fakturPajak);
  // }

  @computedFrom("safeData.fakturPajakDate")
  get highlightDifferencesFakturPajakDate() {
    return this.isValidDate(this.safeData.fakturPajakDate);
  }

  @computedFrom("safeData.fakturPajak")
  get highlightDifferencesFakturPajak() {
    return this.safeData.fakturPajak ? true : false;
  }

  @computedFrom("safeData.fakturPajakDate")
  get highlightDifferencesFakturPajakDate() {
    return this.isValidDate(this.safeData.fakturPajakDate);
  }

  @computedFrom("safeData.fakturPajakDate")
  get cleanedFakturPajakDate() {
    const { fakturPajakDate } = this.safeData;
    return this.isValidDate(fakturPajakDate) ? fakturPajakDate : null;
  }

  @computedFrom("safeData.spbDate")
  get highlightDifferencesSPBDate() {
    return this.isValidDate(this.safeData.spbDate);
  }

  @computedFrom("safeData.spbNo")
  get highlightDifferencesSPBNo() {
    return this.safeData.spbNo ? true : false;
  }

  @computedFrom("safeData.spbDate")
  get cleanedSPBDate() {
    const { spbDate } = this.safeData;
    return this.isValidDate(spbDate) ? spbDate : null;
  }

  @computedFrom("safeData.invoices")
  get highlightDifferencesInvoiceNo() {
    const { invoices } = this.safeData;
    if (!invoices || !Array.isArray(invoices) || !invoices[0]) return false;
    return !!invoices[0].invoiceNo;
  }

  // @computedFrom("data")
  // get scannedInvoiceNo() {
  //   return window.scannedInvoiceNo || "";
  // }

  isValidDate(dateString) {
    if (!dateString) return false;
    return dateString !== View.DEFAULT_DATE;
  }

  activate(params) {
    const idParam = params && params.id;
    this.id = typeof idParam === "string" ? Number(idParam) : idParam;

    const list = Array.isArray(window.listData) ? window.listData : [];
    this.data = list.find((d) => String(d.Id) === String(this.id)) || null;
    this.data.totalSPb = undefined;
    this.data.totalSPb =
      this.data.totalSPb === undefined ||
      this.data.totalSPb === null ||
      this.data.totalSPb === "0"
        ? "-"
        : this.data.totalSPb;
    //this.data.totalSPb = undefined || this.data.totalSPb === null ?  this.data.totalSPb : '0';
    console.log("[View] Semua data SPB:", list);
    console.log("[View] Data SPB yang dipilih:", this.data);

    if (!this.data.invoices || !Array.isArray(this.data.invoices)) {
      if (this.data.Invoice && Array.isArray(this.data.Invoice.Invoice)) {
        this.data.invoices = this.data.Invoice.Invoice.map((inv) => ({
          invoiceNo: inv.InvoiceNumber || "",
          invoiceNoScanResult: inv.InvoiceNumberScanResult || "",
        }));
      } else {
        this.data.invoices = [];
      }
    }
  }

  attached() {
    const table = document.querySelector("table");
    if (table) table.addEventListener("click", this.onTableClick);
  }

  detached() {
    const table = document.querySelector("table");
    if (table) table.removeEventListener("click", this.onTableClick);
  }

  onTableClick(evt) {
    const btn = evt.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");

    if (action === "info") {
      this.showInfo(id);

      const list = Array.isArray(window.listData) ? window.listData : [];
      const row = list.find((x) => String(x.Id) === String(id));

      // ===== ITEMS =====
      if (row && Array.isArray(row.items)) {
        if (this.showItemsTable && this.itemsData === row.items) {
          this.showItemsTable = false;
          this.itemsData = [];
        } else {
          this.itemsData = row.items;
          this.showItemsTable = true;
        }
      } else {
        this.itemsData = [];
        this.showItemsTable = false;
      }

      // ===== BON =====
      this.urnsData =
        row && Array.isArray(row.unitReceiptNotes) ? row.unitReceiptNotes : [];
      this.showURNsTable = true;

      // ===== Invoice =====
      // this.invoicesData =
      //   row && Array.isArray(row.invoices) ? row.invoices : [];
      // this.showInvoicesTable = true;

      // ===== PR =====
      this.prsData =
        row && Array.isArray(row.purchaseRequests) ? row.purchaseRequests : [];
      this.showPRsTable = true;

      // ===== PO =====
      this.posData =
        row && Array.isArray(row.purchaseOrders) ? row.purchaseOrders : [];
      this.showPOsTable = true;

      // this.taxData = row && Array.isArray(row.tax) ? row.tax : [];
      // this.showTaxTable = true;
    }
  }

  showInfo(id) {
    const list = Array.isArray(window.listData) ? window.listData : [];
    const row = list.find((x) => String(x.Id) === String(id));
    if (!row) return;
    this.router.navigateToRoute("view", { id: row.Id });
  }

  cancel() {
    if (confirm("Apakah Anda yakin akan kembali?")) {
      this.router.navigateToRoute("list");
    }
  }
}
