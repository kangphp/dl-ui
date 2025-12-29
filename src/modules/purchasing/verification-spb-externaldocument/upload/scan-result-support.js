import { bindable } from "aurelia-framework";

const DEBUG_UPLOAD = false;
const logger = {
  log: (...args) => {
    if (DEBUG_UPLOAD) console.log(...args);
  },
  warn: (...args) => {
    if (DEBUG_UPLOAD) console.warn(...args);
  },
  error: (...args) => {
    if (DEBUG_UPLOAD) console.error(...args);
  },
};

export class ScanResultSupport {
  @bindable result;
  @bindable editing = false;
  expandedPOIndex = null;

  activate(model) {
    if (model && "result" in model) this.result = model.result;
    this._build();
  }

  bind() {
    this._build();
  }

  resultChanged() {
    this._build();
  }

  _build() {
    const root = this.result
      ? this.result.data || this.result.Data || this.result
      : null;

    console.log("ScanResultSupport _build root:", root);

    const urnArr =
      (root && root.URNs && (root.URNs.URNs || root.URNs.urn)) ||
      (root &&
        root.UnitReceiptNote &&
        (root.UnitReceiptNote.URNItems || root.UnitReceiptNote.URNItem)) ||
      (root && root.URN && (root.URN.URNs || root.URN.urn)) ||
      [];

    const poArr = [];
    if (root && root.PurchaseOrder) {
      // Jika ada array POs (standar baru)
      if (Array.isArray(root.PurchaseOrder.POs)) {
        root.PurchaseOrder.POs.forEach((po) => {
          poArr.push({
            POHeader: po.POHeader,
            POItems: Array.isArray(po.POItems) ? po.POItems : [],
          });
        });
      }
      // Jika bentuk lama: object tunggal
      else if (root.PurchaseOrder.POHeader && root.PurchaseOrder.POItems) {
        poArr.push({
          POHeader: root.PurchaseOrder.POHeader,
          POItems: Array.isArray(root.PurchaseOrder.POItems)
            ? root.PurchaseOrder.POItems
            : [],
        });
      }
      // Jika langsung array (fallback lama)
      else if (Array.isArray(root.PurchaseOrder)) {
        root.PurchaseOrder.forEach((po) => {
          poArr.push({
            POHeader: po.POHeader,
            POItems: Array.isArray(po.POItems) ? po.POItems : [],
          });
        });
      }
    }

    const prArr =
      (root && root.PRs && (root.PRs.PRs || root.PRs.PR)) ||
      (root &&
        root.PurchaseRequest &&
        (root.PurchaseRequest.PRs || root.PurchaseRequest.PRHeader)) ||
      (root && root.PR && root.PR.PRs) ||
      [];

    const taxContainer = (root && (root.TaxInvoice || root.taxInvoice)) || null;
    let taxObj = null;
    if (taxContainer) {
      taxObj = taxContainer.TaxInvoice || taxContainer.taxInvoice || null;
      if (
        !taxObj &&
        (taxContainer.TaxInvoiceNumber ||
          taxContainer.TaxInvoiceDate ||
          taxContainer.ValueAddedTax)
      ) {
        taxObj = taxContainer;
      }
    }

    const invoiceArr =
      (root &&
        root.Invoices &&
        (root.Invoices.Invoices || root.Invoices.invoice)) ||
      (root && root.Invoice && root.Invoice.Invoice) ||
      [];

    this.urnRows = Array.isArray(urnArr) ? urnArr : [];
    this.poRows = Array.isArray(poArr) ? poArr : [];
    this.invoiceRows = Array.isArray(invoiceArr) ? invoiceArr : [];
    this.prRows = Array.isArray(prArr) ? prArr : [];
    this.taxRows = taxObj ? [taxObj] : [];

    console.log(
      "[scan-support] counts => urn:",
      this.urnRows.length,
      "po:",
      this.poRows.length,
      "invoice:",
      this.invoiceRows.length,
      "pr:",
      this.prRows.length,
      "tax:",
      this.taxRows.length
    );

    this.tableOptions = {
      pagination: false,
      search: false,
      showColumns: false,
      showToggle: false,
      pageSize: 50,
      locale: "id-ID",
    };

    this.urnColumns = [
      {
        field: "PurchaseRequestNumber",
        title: "Nomor Purchase Request / BON",
        sortable: true,
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

    this.poColumns = [
      {
        field: "PurchaseOrderNumber",
        title: "Nomor Purchase Order",
        sortable: true,
        formatter: (_, row) =>
          row.POHeader ? row.POHeader.PurchaseOrderNumber : "-",
      },
      {
        field: "GrandTotalAfterTax",
        title: "Grand Total",
        formatter: (_, row) =>
          row.POHeader
            ? this.formatNumber(row.POHeader.GrandTotalAfterTax)
            : "-",
      },
      {
        field: "actions",
        title: "",
        align: "center",
        formatter: (_, row, __, idx) =>
          `<button type="button" class="btn btn-info btn-sm" data-index="${idx}" onclick="window.showPODetail && window.showPODetail(event)">
        <i class="fa fa-info"></i>
      </button>`,
      },
    ];

    this.prColumns = [
      {
        field: "PurchaseRequestNumber",
        title: "Nomor Purchase Request",
        sortable: true,
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

    this.taxColumns = [
      { field: "TaxInvoiceNumber", title: "No. Faktur Pajak" },
      // { field: 'TaxInvoiceDate', title: 'Tanggal Faktur', formatter: (v) => this.formatDate(v) },
      {
        field: "TaxInvoiceDateOffset",
        title: "Tanggal Faktur",
        formatter: (v) => this.formatDate(v),
      },
      {
        field: "ValueAddedTax",
        title: "PPN",
        align: "right",
        formatter: (v) => this.formatNumber(v),
      },
    ];

    this.invoiceColumns = [
      { field: "InvoiceNumber", title: "Nomor Invoice", sortable: true },
      {
        field: "InvoiceDateOffset",
        title: "Tanggal Invoice",
        formatter: (value) => this.formatDate(value),
        sortable: true,
      },
      {
        field: "GrandTotalAfterTax",
        title: "Jumlah",
        formatter: (value) => this.formatNumber(value),
      },
    ];
  }

  get hasURN() {
    return Array.isArray(this.urnRows) && this.urnRows.length > 0;
  }

  get hasPO() {
    return Array.isArray(this.poRows) && this.poRows.length > 0;
  }

  get hasInvoice() {
    return Array.isArray(this.invoiceRows) && this.invoiceRows.length > 0;
  }

  get hasPR() {
    return Array.isArray(this.prRows) && this.prRows.length > 0;
  }

  get hasTax() {
    return Array.isArray(this.taxRows) && this.taxRows.length > 0;
  }

  get poItemsColumns() {
    return [
      { field: "ItemName", title: "Nama Barang" },
      { field: "Quantity", title: "Qty" },
      {
        field: "UnitPrice",
        title: "Harga Satuan",
        formatter: (v) => this.formatNumber(v),
      },
    ];
  }

  attached() {
    window.showPODetail = (e) => {
      e.preventDefault();
      e.stopPropagation && e.stopPropagation();
      const idx = Number(e.target.getAttribute("data-index"));
      this.expandedPOIndex = this.expandedPOIndex === idx ? null : idx;
    };
  }

  get selectedPOItems() {
    if (
      this.expandedPOIndex == null ||
      !Array.isArray(this.poRows) ||
      !this.poRows[this.expandedPOIndex]
    )
      return [];
    return this.poRows[this.expandedPOIndex].POItems || [];
  }

  showPOItems(idx) {
    const po = this.poRows[idx];
    this.selectedPOItems = po.POItems;
    this.showPOItemsTable = true;
  }

  formatNumber(v) {
    if (v == null) return "";
    const n = Number(v);
    if (isNaN(n)) return v;
    return n.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  formatDate(v) {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d)) return v;
    const dd = String(d.getDate()).padStart(2, "0");
    const monthLong = d.toLocaleDateString("id-ID", { month: "long" });
    const yy = d.getFullYear();
    return `${dd} ${monthLong} ${yy}`;
  }

  toDateInputValue(v) {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d)) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  startEdit() {
    this.editing = true;
    logger.log("[support] Starting edit of scan result");
    const tryEdit = (n = 10) => {
      setTimeout(() => {
        const okUrn = this._enterURNEdit();
        const okPo = this._enterPOEdit();
        const okInvoice = this._enterInvoiceEdit();
        const okTax = this._enterTaxEdit();
        if ((!okUrn || !okPo || !okInvoice || !okTax) && n > 0) tryEdit(n - 1);
      }, 100);
    };
    tryEdit();
  }

  saveEdit() {
    logger.log("[support] Saving edited scan result");
    try {
      this._persistURNEdit();
    } catch (e) {
      logger.warn("[support] _persistURNFromInputs error", e);
    }
    try {
      this._persistPOEdit();
    } catch (e) {
      logger.warn("[support] _persistPOFromInputs error", e);
    }
    try {
      this._persistInvoiceEdit();
    } catch (e) {
      logger.warn("[support] _persistInvoiceFromInputs error", e);
    }
    try {
      this._persistTaxEdit();
    } catch (e) {
      logger.warn("[support] _persistTaxFromInputs error", e);
    }
    this.editing = false;

    try {
      this._renderURNReadonly();
    } catch (e) {
      logger.warn("[support] _renderURNReadonly error", e);
    }

    try {
      this._renderPOReadonly();
    } catch (e) {
      logger.warn("[support] _renderPOReadonly error", e);
    }

    try {
      this._renderInvoiceReadonly();
    } catch (e) {
      logger.warn("[support] _renderInvoiceReadonly error", e);
    }

    try {
      this._renderTaxReadonly();
    } catch (e) {
      logger.warn("[support] _renderTaxReadonly error", e);
    }
  }

  _getBodyTable(container) {
    if (!container) return null;
    let bodyTable = container.querySelector(".fixed-table-body table");
    if (!bodyTable)
      bodyTable = container.querySelector(
        ".bootstrap-table .fixed-table-body table"
      );
    if (!bodyTable) {
      const candidates = container.querySelectorAll("table");
      for (let t of candidates) {
        const tb = t.querySelector("tbody");
        if (tb && tb.rows && tb.rows.length > 0) {
          bodyTable = t;
          break;
        }
      }
    }
    return bodyTable;
  }

  _getBodyRows(container) {
    const table = this._getBodyTable(container);
    if (!table) return [];
    return Array.from(table.querySelectorAll("tbody tr"));
  }

  _enterURNEdit() {
    if (!this.hasURN) return true;
    const rows = this._getBodyRows(this.urnContainer);
    if (!rows || rows.length !== this.urnRows.length) return false;
    rows.forEach((tr, i) => {
      if (!this.urnRows[i]) return;
      const td0 = tr.cells && tr.cells[0];
      const prVal =
        this.urnRows[i].PurchaseRequestNumber ||
        this.urnRows[i].urnNo ||
        this.urnRows[i].UnitReceiptNoteNumber ||
        "";
      const prRaw = prVal == null ? "" : String(prVal).replace(/\"/g, "&quot;");
      if (td0) {
        td0.innerHTML = `<input type="text" class="form-control input-sm urn-no-input" data-scope="urn"
          data-index="${i}" data-field="PurchaseRequestNumber" value="${prRaw}" style="min-width:160px;"/>`;
      }
      const td1 = tr.cells && tr.cells[1];
      const qtyVal = this.urnRows[i].Quantity || this.urnRows[i].quantity || 0;
      const qtyRaw = qtyVal == null ? "" : String(qtyVal);
      if (td1) {
        td1.innerHTML = `<input type="number" step="1" class="form-control input-sm urn-qty-input" data-scope="urn"
          data-index="${i}" data-field="Quantity" value="${qtyRaw}" style="min-width:100px;"/>`;
      }
    });
    return true;
  }

  _persistURNEdit() {
    if (!this.urnContainer || !Array.isArray(this.urnRows)) return;
    const inputsPR = this.urnContainer.querySelectorAll(
      'input.urn-no-input[data-scope="urn"]'
    );
    inputsPR.forEach((input) => {
      const index = parseInt(input.getAttribute("data-index"), 10);
      const field = input.getAttribute("data-field");
      if (!isNaN(index) && this.urnRows[index]) {
        this.urnRows[index][field] = input.value;
      }
    });
    const inputsQty = this.urnContainer.querySelectorAll(
      'input.urn-qty-input[data-scope="urn"]'
    );
    inputsQty.forEach((input) => {
      const index = parseInt(input.getAttribute("data-index"), 10);
      const field = input.getAttribute("data-field");
      if (!isNaN(index) && this.urnRows[index]) {
        const n = Number(input.value);
        this.urnRows[index][field] = isNaN(n) ? input.value : n;
      }
    });
  }

  _renderURNReadonly() {
    const rows = this._getBodyRows(this.urnContainer);
    rows.forEach((tr, i) => {
      const td0 = tr.cells && tr.cells[0];
      const td1 = tr.cells && tr.cells[1];
      if (td0 && this.urnRows[i])
        td0.textContent =
          this.urnRows[i].PurchaseRequestNumber ||
          this.urnRows[i].urnNo ||
          this.urnRows[i].UnitReceiptNoteNumber ||
          "";
      if (td1 && this.urnRows[i])
        td1.textContent =
          this.urnRows[i].Quantity || this.urnRows[i].quantity || "";
    });
  }

  _enterPOEdit() {
    if (!this.hasPO) return true;
    const rows = this._getBodyRows(this.poContainer);
    if (!rows || rows.length === 0) return false;
    rows.forEach((tr, i) => {
      const td = tr.cells && tr.cells[0];
      if (!td || !this.poRows[i] || !this.poRows[i].POHeader) return;
      const val = this.poRows[i].POHeader.PurchaseOrderNumber || "";
      const raw = val == null ? "" : String(val).replace(/\"/g, "&quot;");
      td.innerHTML = `<input type="text" class="form-control input-sm po-no-input" data-scope="po"
      data-index="${i}" data-field="PurchaseOrderNumber" value="${raw}" style="min-width:160px;"/>`;
    });
    return true;
  }

  _persistPOEdit() {
    if (!this.poContainer || !Array.isArray(this.poRows)) return;
    const inputs = this.poContainer.querySelectorAll(
      'input.po-no-input[data-scope="po"]'
    );
    inputs.forEach((input) => {
      const index = parseInt(input.getAttribute("data-index"), 10);
      const field = input.getAttribute("data-field");
      if (!isNaN(index) && this.poRows[index] && this.poRows[index].POHeader) {
        this.poRows[index].POHeader[field] = input.value;
      }
    });
  }

  _renderPOReadonly() {
    const rows = this._getBodyRows(this.poContainer);
    rows.forEach((tr, i) => {
      const td = tr.cells && tr.cells[0];
      if (td && this.poRows[i] && this.poRows[i].POHeader)
        td.textContent = this.poRows[i].POHeader.PurchaseOrderNumber || "";
    });
  }

  _enterInvoiceEdit() {
    if (!this.hasInvoice) return true;
    const rows = this._getBodyRows(this.invoiceContainer);
    if (!rows || rows.length !== this.invoiceRows.length) return false;
    rows.forEach((tr, i) => {
      if (!this.invoiceRows[i]) return;
      // td0 : InvoiceNumber
      const td0 = tr.cells && tr.cells[0];
      const invNo =
        this.invoiceRows[i].InvoiceNumber ||
        this.invoiceRows[i].InvoiceNo ||
        "";
      const invNoRaw =
        invNo == null ? "" : String(invNo).replace(/\"/g, "&quot;");
      if (td0) {
        td0.innerHTML = `<input type="text" class="form-control input-sm invoice-no-input" data-scope="invoice"
          data-index="${i}" data-field="InvoiceNumber" value="${invNoRaw}" style="min-width:160px;"/>`;
      }
      // td1 : InvoiceDate
      const td1 = tr.cells && tr.cells[1];
      const invDate =
        this.invoiceRows[i].InvoiceDate ||
        this.invoiceRows[i].InvoiceDateOffset ||
        this.invoiceRows[i].InvoiceDateString ||
        "";
      const dateVal = this.toDateInputValue(invDate);
      if (td1) {
        td1.innerHTML = `<input type="date" class="form-control input-sm invoice-date-input" data-scope="invoice"
          data-index="${i}" data-field="InvoiceDate" value="${dateVal}" style="min-width:160px;"/>`;
      }
      // td2 : GrandTotalAfterTax / GrandTotalBeforeTax
      const td2 = tr.cells && tr.cells[2];
      const amount =
        this.invoiceRows[i].GrandTotalAfterTax ||
        this.invoiceRows[i].GrandTotalBeforeTax ||
        this.invoiceRows[i].TotalAmount ||
        0;
      const amountRaw = amount == null ? "" : String(amount);
      if (td2) {
        td2.innerHTML = `<input type="number" step="0.01" class="form-control input-sm invoice-amount-input" data-scope="invoice"
          data-index="${i}" data-field="GrandTotalAfterTax" value="${amountRaw}" style="min-width:120px;"/>`;
      }
    });
    return true;
  }

  _persistInvoiceEdit() {
    if (!this.invoiceContainer || !Array.isArray(this.invoiceRows)) return;
    const inputsNo = this.invoiceContainer.querySelectorAll(
      'input.invoice-no-input[data-scope="invoice"]'
    );
    inputsNo.forEach((input) => {
      const index = parseInt(input.getAttribute("data-index"), 10);
      const field = input.getAttribute("data-field");
      if (!isNaN(index) && this.invoiceRows[index]) {
        this.invoiceRows[index][field] = input.value;
      }
    });
    const inputsDate = this.invoiceContainer.querySelectorAll(
      'input.invoice-date-input[data-scope="invoice"]'
    );
    inputsDate.forEach((input) => {
      const index = parseInt(input.getAttribute("data-index"), 10);
      const field = input.getAttribute("data-field");
      if (!isNaN(index) && this.invoiceRows[index]) {
        this.invoiceRows[index][field] = input.value;
      }
    });
    const inputsAmount = this.invoiceContainer.querySelectorAll(
      'input.invoice-amount-input[data-scope="invoice"]'
    );
    inputsAmount.forEach((input) => {
      const index = parseInt(input.getAttribute("data-index"), 10);
      const field = input.getAttribute("data-field");
      if (!isNaN(index) && this.invoiceRows[index]) {
        const n = Number(input.value);
        this.invoiceRows[index][field] = isNaN(n) ? input.value : n;
      }
    });
  }

  _renderInvoiceReadonly() {
    const rows = this._getBodyRows(this.invoiceContainer);
    rows.forEach((tr, i) => {
      const td0 = tr.cells && tr.cells[0];
      const td1 = tr.cells && tr.cells[1];
      const td2 = tr.cells && tr.cells[2];
      if (td0 && this.invoiceRows[i])
        td0.textContent =
          this.invoiceRows[i].InvoiceNumber ||
          this.invoiceRows[i].InvoiceNo ||
          "";
      if (td1 && this.invoiceRows[i])
        td1.textContent = this.formatDate(
          this.invoiceRows[i].InvoiceDate ||
            this.invoiceRows[i].InvoiceDateOffset ||
            ""
        );
      if (td2 && this.invoiceRows[i])
        td2.textContent = this.formatNumber(
          this.invoiceRows[i].GrandTotalAfterTax ||
            this.invoiceRows[i].GrandTotalBeforeTax ||
            this.invoiceRows[i].TotalAmount
        );
    });
  }

  _enterTaxEdit() {
    if (!this.hasTax) return;
    const table = this._getBodyTable(this.taxContainer);
    logger.log("[support] tax body table:", table);
    if (!table) return false;
    const tr = table.querySelector("tbody tr");
    logger.log("[support] tax first row:", tr);
    if (!tr || !this.taxRows[0]) return false;

    const tax = this.taxRows[0];
    // Kolom: [0] No Faktur, [1] Tgl Faktur, [2] Tgl Jatuh Tempo, [3] PPN
    // Editable: [0] TaxInvoiceNumber (text), [2] TaxInvoiceDateOffset (text/number string), [3] ValueAddedTax (number)
    const map = [
      { idx: 0, field: "TaxInvoiceNumber", type: "text" },
      { idx: 1, field: "TaxInvoiceDateOffset", type: "date" },
      { idx: 2, field: "ValueAddedTax", type: "number" },
    ];
    map.forEach((m) => {
      const td = tr.cells[m.idx];
      if (!td) return;
      const val = tax[m.field];
      if (m.type === "number") {
        const raw =
          val === null || val === undefined || val === "" ? "" : String(val);
        td.innerHTML = `<input type="number" step="any" class="form-control input-sm sup-input" data-scope="tax" data-field="${m.field}" value="${raw}" style="min-width:120px; text-align:right;" />`;
      } else if (m.type === "date") {
        const raw = this.toDateInputValue(val);
        td.innerHTML = `<input type="date" class="form-control input-sm sup-input" data-scope="tax" data-field="${m.field}" value="${raw}" style="min-width:140px;" />`;
      } else {
        const raw =
          val === null || val === undefined
            ? ""
            : String(val).replace(/\"/g, "&quot;");
        td.innerHTML = `<input type="text" class="form-control input-sm sup-input" data-scope="tax" data-field="${m.field}" value="${raw}" style="min-width:120px;" />`;
      }
    });
    return true;
  }

  _persistTaxFromInputs() {
    if (!this.taxContainer || !this.taxRows || this.taxRows.length === 0)
      return;
    const inputs = this.taxContainer.querySelectorAll(
      'input.sup-input[data-scope="tax"]'
    );
    const tax = this.taxRows[0];
    inputs.forEach((inp) => {
      const field = inp.getAttribute("data-field");
      let v = inp.value;
      if (field === "ValueAddedTax") v = v === "" ? null : Number(v);
      // keep date string as-is for TaxInvoiceDateOffset from input type=date
      tax[field] = v;
    });
  }

  _renderTaxReadonly() {
    const table = this._getBodyTable(this.taxContainer);
    if (!table || !this.taxRows || this.taxRows.length === 0) return;
    const tr = table.querySelector("tbody tr");
    if (!tr) return;
    const tax = this.taxRows[0];
    // Sync kembali tampilan
    const set = [
      { idx: 0, value: tax.TaxInvoiceNumber },
      // { idx: 1, value: this.formatDate(tax.TaxInvoiceDate) },
      { idx: 1, value: this.formatDate(tax.TaxInvoiceDateOffset) },
      { idx: 2, value: this.formatNumber(tax.ValueAddedTax) },
    ];
    set.forEach((s) => {
      const td = tr.cells[s.idx];
      if (td) td.textContent = s.value == null ? "" : String(s.value);
    });
  }
}

export default ScanResultSupport;
