import { bindable } from "aurelia-framework";

const DEBUG_UPLOAD = false;
const logger = {
  log: (...args) => {
    if (DEBUG_UPLOAD) console.log(...args);
  },
  warn: (...args) => {
    console.warn(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
};

export class ScanResultData {
  @bindable result;
  editing = false;
  editedJsonString = "";

  activate(model) {
    if (model && "result" in model) {
      this.result = model.result;
      this.currentKey = model.key || 0;
    }
    this._extract();
  }

  bind() {
    this._extract();
  }

  modelChanged(newModel) {
    this.editing = false;
    this.showItems = false;

    const newKey = (newModel && newModel.key) || 0;
    const keyChanged = this.currentKey !== newKey;

    if (keyChanged) {
      this._clearData();
    }

    this.result = newModel && "result" in newModel ? newModel.result : null;
    this.currentKey = newKey;
    this._extract();
  }

  resultChanged() {
    this._extract();
  }

  _clearData() {
    this.header = null;
    this.items = [];
    this.headerData = [];
    this.showItems = false;
  }

  _extract() {
    this.header = null;
    this.items = [];
    this.headerData = [];
    this.showItems = false;
    if (!this.result) {
      this._buildTables();
      return;
    }
    const root = this.result
      ? this.result.data || this.result.Data || this.result
      : null;
    let upo = null;
    if (root) {
      upo =
        root["UPO"] || root["Upo"] || root["UpoResult"] || root["SPB"] || null;
    }
    const headerCandidate =
      (upo && (upo.Header || upo.header)) ||
      (root && (root.header || root.Header)) ||
      null;
    const itemsCandidate =
      (upo && (upo.Items || upo.items)) ||
      (root && (root.Items || root.items)) ||
      [];
    this.header = headerCandidate || null;
    this.items = Array.isArray(itemsCandidate) ? itemsCandidate : [];

    const taxInvoice = root && root.TaxInvoice && root.TaxInvoice.TaxInvoice;
    const invoice =
      root && root.Invoice && root.Invoice.Invoice && root.Invoice.Invoice[0];

    if (this.header) {
      if (
        this.header.ValueAddedTax === undefined ||
        this.header.ValueAddedTax === null
      ) {
        if (taxInvoice && taxInvoice.ValueAddedTax !== undefined) {
          this.header.ValueAddedTax = taxInvoice.ValueAddedTax;
        } else if (invoice && invoice.ValueAddedTax !== undefined) {
          this.header.ValueAddedTax = invoice.ValueAddedTax;
        }
      }
    }
    this._buildTables();
  }

  _buildTables() {
    const self = this;
    this.headerData = this.header ? [this.header] : [];
    this.tableOptions = {
      pagination: false,
      search: false,
      showColumns: false,
      showToggle: false,
      pageSize: 50,
      locale: "id-ID",
    };
    this.headerColumns = [
      { field: "SPBNumber", title: "Nomor SPB" },
      {
        field: "SPBDateOffset",
        title: "Tanggal SPB",
        formatter: (v) => self.formatDateLong(v),
      },
      {
        field: "TotalAmountBeforeTax",
        title: "Jumlah",
        formatter: (v) => self.formatNumber(v),
      },
      {
        field: "ValueAddedTax",
        title: "PPN",
        formatter: (v) => self.formatNumber(v),
      },
      {
        field: "TotalAmountAfterTax",
        title: "Total",
        formatter: (v) => self.formatNumber(v),
      },
      {
        field: "__toggle",
        title: "",
        align: "center",
        width: 180,
        formatter: () =>
          `<div style="white-space:nowrap; display:inline-flex; align-items:center;">
						<button class="btn btn-info btn-sm toggle-items">i</button>
						<button class="btn btn-warning btn-sm action-edit" title="Edit" style="margin-left:6px;"><i class="fa fa-edit"></i></button>
						<button class="btn btn-success btn-sm action-save" title="Simpan" style="margin-left:6px;" disabled><i class="fa fa-save"></i></button>
					</div>`,
        events: {
          "click .toggle-items": function (e) {
            try {
              if (e) {
                e.preventDefault();
                e.stopPropagation();
              }
            } catch (_) {}
            self.toggleItems();
          },
          "click .action-edit": function (e) {
            try {
              if (e) {
                e.preventDefault();
                e.stopPropagation();
              }
            } catch (_) {}
            self.startEdit();

            const $cell = $(e.currentTarget).closest("td");
            $cell.find(".action-save").prop("disabled", false);
          },
          "click .action-save": function (e) {
            try {
              if (e) {
                e.preventDefault();
                e.stopPropagation();
              }
            } catch (_) {}
            if ($(e.currentTarget).prop("disabled")) return;
            self.saveEdit();

            const $cell = $(e.currentTarget).closest("td");
            $cell.find(".action-save").prop("disabled", true);
          },
        },
      },
    ];
  }

  get hasHeader() {
    return !!this.header;
  }
  get hasItems() {
    return this.items && this.items.length > 0;
  }

  attached() {
    this._panelHeader = (e) => {
      if (!this.editing) return;
      const input = e.target.closest("input.sr-input");
      if (!input) return;
      const field = input.getAttribute("data-field");
      const scope = input.getAttribute("data-scope") || "header";
      if (scope === "header") {
        if (this.header && field) {
          let v = input.value;
          if (
            [
              "TotalAmountBeforeTax",
              "ValueAddedTax",
              "TotalAmountAfterTax",
            ].includes(field)
          ) {
            v = v === "" ? null : Number(v);
            if (v == null || v === "") return;
            if (v === this.header[field]) return;
          }
          if (field === "SPBDateOffset") {
            v = v || null;
            if (v === this.header[field]) return;
          }
          if (field === "SPBNumber") {
            v = v || null;
            if (v === this.header[field]) return;
          }
          this.header[field] = v;
        }
      } else if (scope === "item") {
        const idx = parseInt(input.getAttribute("data-idx"), 10);
        if (!isNaN(idx) && this.items && this.items[idx]) {
          let v = input.value;
          v = v === "" ? null : Number(v);
          this.items[idx][field] = v;
          if (field === "Quantity" || field === "PricePerUnit") {
            const qty = Number(this.items[idx]["Quantity"]) || 0;
            const price = Number(this.items[idx]["PricePerUnit"]) || 0;
            this.items[idx]["TotalPrice"] = qty * price;
            const row = input.closest("tr");
            if (row) {
              const totalCell = row.cells[4];
              if (
                totalCell &&
                totalCell.querySelector(
                  'input.sr-input[data-field="TotalPrice"]'
                )
              ) {
                totalCell.querySelector("input.sr-input").value =
                  this.items[idx].TotalPrice || 0;
              }
            }
          }
        }
      }
    };
    if (this.panel) this.panel.addEventListener("input", this._panelHeader);

    this._panelClick = (e) => {
      const editBtn =
        e.target && e.target.closest && e.target.closest("button.action-edit");
      if (editBtn) {
        try {
          e.preventDefault();
          e.stopPropagation();
        } catch (_) {}
        this.startEdit();
        return;
      }
      const saveBtn =
        e.target && e.target.closest && e.target.closest("button.action-save");
      if (saveBtn) {
        try {
          e.preventDefault();
          e.stopPropagation();
        } catch (_) {}
        this.saveEdit();
        return;
      }
      const toggleBtn =
        e.target && e.target.closest && e.target.closest("button.toggle-items");
      if (toggleBtn) {
        try {
          e.preventDefault();
          e.stopPropagation();
        } catch (_) {}
        this.toggleItems();
        return;
      }
    };
    if (this.panel) this.panel.addEventListener("click", this._panelClick);
  }

  formatDateLong(v) {
    if (!v) return "";
    const date = new Date(v);
    if (isNaN(date)) return v;
    const day = date.toLocaleDateString("id-ID", { day: "2-digit" });
    const month = date.toLocaleDateString("id-ID", { month: "long" });
    const year = date.toLocaleDateString("id-ID", { year: "numeric" });
    return `${day} ${month} ${year}`;
  }
  toDateInputValue(v) {
    if (!v) return "";
    const date = new Date(v);
    if (isNaN(date)) return v;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  detached() {
    if (this.panel && this._panelHandler)
      this.panel.removeEventListener("input", this._panelHandler);
    if (this.panel && this._panelClick)
      this.panel.removeEventListener("click", this._panelClick);
  }

  toggleItems() {
    if (!this.hasItems) return;
    this.showItems = !this.showItems;
    if (this.editing && this.showItems)
      setTimeout(() => {
        try {
          this._tryEnterItemsEdit();
        } catch (_) {}
      }, 0);
  }

  formatNumber(v) {
    if (v == null) return "";
    const n = Number(v);
    if (isNaN(n)) return v;
    return n.toLocaleString("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  startEdit() {
    this.editing = true;
    logger.log("startEdit called, showItems=", this.showItems);
    setTimeout(() => {
      try {
        this._enterHeaderEdit();
      } catch (e) {
        logger.warn("Error in _enterHeaderEdit", e);
      }
      try {
        logger.log("Support ref on edit", this.supportRef);
        if (this.supportRef && this.supportRef.startEdit) {
          this.supportRef.startEdit();
          this._trySupportEdit(8);
        } else {
          logger.log("No supportRef or startEdit not found");
        }
      } catch (e) {
        logger.warn("Error in supportRef startEdit", e);
      }
      try {
        if (this.showItems) {
          logger.log("Calling _enterItemsEdit from startEdit");
          setTimeout(() => {
            this._enterItemsEdit();
            this._tryEnterItemsEdit(10);
          }, 200);
        } else {
          logger.log("Not entering items edit, showItems is false");
        }
      } catch (e) {
        logger.warn("Error in _enterItemsEdit", e);
      }
    }, 0);
  }

  _trySupportEdit(attempts = 5) {
    if (attempts <= 0) return;
    setTimeout(() => {
      try {
        if (this.supportRef && this.supportRef.startEdit) {
          this.supportRef.startEdit();
        }
      } catch (_) {}
    }, 200);
  }

  saveEdit() {
    try {
      this._persisHeaderFromInputs();
    } catch (_) {}
    try {
      this._persistItemsFromInputs();
    } catch (_) {}

    try {
      logger.log("Support ref on save", this.supportRef);
      if (this.supportRef && this.supportRef.saveEdit) {
        logger.log("Calling supportRef.saveEdit()");
        this.supportRef.saveEdit();
      } else {
        logger.log("No supportRef or saveEdit not found");
      }
    } catch (e) {
      logger.warn("Error in supportRef saveEdit", e);
    }
    this.editing = false;

    try {
      this._renderHeaderReadOnly();
    } catch (_) {}

    try {
      if (this.showItems) {
        this._renderItemsReadOnly();
      }
    } catch (_) {}

    try {
      const newHeader = this.header ? { ...this.header } : null;
      this.headerData = newHeader ? [newHeader] : [];

      if (Array.isArray(this.items)) {
        this.items = this.items.map((item) => ({ ...item }));
      }

      if (this.supportRef) {
        if (Array.isArray(this.supportRef.urnRows))
          this.supportRef.urnRows = this.supportRef.urnRows.map((urnRows) => ({
            ...urnRows,
          }));
        if (Array.isArray(this.supportRef.poRows))
          this.supportRef.poRows = this.supportRef.poRows.map((poRows) => ({
            ...poRows,
          }));
        if (Array.isArray(this.supportRef.invoiceRows))
          this.supportRef.invoiceRows = this.supportRef.invoiceRows.map(
            (invRow) => ({ ...invRow })
          );
      }
    } catch (_) {}

    try {
      this._applyEditsToResult();
    } catch (e) {
      logger.warn("Error applying edits to result", e);
    }
    try {
      this._showeditJsonString();
    } catch (_) {}
  }

  _applyEditsToResult() {
    try {
      if (!this.result) return;

      const root = this.result.data || this.result.Data || this.result;

      if (this.header) {
        if (root.UPO && root.UPO.Header) {
          Object.assign(root.UPO.Header, this.header);
        } else if (root.header) {
          Object.assign(root.header, this.header);
        }
      }

      if (Array.isArray(this.items) && this.items.length > 0) {
        if (root.UPO && Array.isArray(root.UPO.Items)) {
          root.UPO.Items = this.items;
        } else if (Array.isArray(root.Items)) {
          root.Items = this.items;
        }
      }

      if (this.supportRef) {
        const urnRows = this.supportRef.urnRows || [];
        const poRows = this.supportRef.poRows || [];
        const invoiceRows = this.supportRef.invoiceRows || [];

        if (urnRows.length) {
          if (root.UnitReceiptNote) {
            if ("URNItem" in root.UnitReceiptNote)
              root.UnitReceiptNote.URNItem = urnRows;
            if ("URNItems" in root.UnitReceiptNote)
              root.UnitReceiptNote.URNItems = urnRows;
          }
          if (root.URNs) {
            if ("urn" in root.URNs) root.URNs.urn = urnRows;
            if ("URNs" in root.URNs) root.URNs.URNs = urnRows;
          }
        }

        if (poRows.length) {
          if (root.PurchaseOrder) {
            root.PurchaseOrder.POs = poRows;
          }
        }

        if (invoiceRows.length) {
          if (root.Invoice) {
            if ("Invoice" in root.Invoice) root.Invoice.Invoice = invoiceRows;
          }
          if (root.Invoices) {
            if ("invoice" in root.Invoices) root.Invoices.invoice = invoiceRows;
            if ("Invoices" in root.Invoices)
              root.Invoices.Invoices = invoiceRows;
          }
        }
      }

      if (this.result.data) this.result.data = root;
      else if (this.result.Data) this.result.Data = root;
      else this.result = root;

      logger.log("[scan-data] applied edits to result");
    } catch (e) {
      logger.warn("Error applying edits to result", e);
      throw e;
    }
  }

  _getHeaderRow() {
    if (this.headerTableEl) {
      const tr = this.headerTableEl.querySelector("tbody tr");
      if (tr) return tr;
    }

    if (!this.panel) return null;
    const tr = this.panel.querySelector("table tbody tr");
    return tr || null;
  }

  _getItemsTable() {
    if (!this.showItems) return null;
    if (this.itemsContainer) {
      let bodyTable = this.itemsContainer.querySelector(
        ".fixed-table-body table"
      );
      if (!bodyTable)
        bodyTable = this.itemsContainer.querySelector(
          "bootstrap-table fixed-table-body table"
        );
      if (!bodyTable) {
        const candidateTables = this.itemsContainer.querySelectorAll("table");
        for (let tbl of candidateTables) {
          const tb = tbl.querySelector("tbody");
          if (tb && tb.rows && tb.rows.length > 0) {
            bodyTable = tbl;
            break;
          }
        }
      }
      if (bodyTable) {
        logger.log("Items table found:", bodyTable);
        return bodyTable;
      }
      const orig = this.itemsContainer.querySelector("table");
      if (orig) {
        logger.log("Items table found (fallback):", orig);
        return orig;
      }
    }
    if (!this.panel) return null;
    const tables = this.panel.querySelectorAll("table");
    logger.log("All tables in panel:", tables).length;
    if (tables.length < 2) {
      const allTables = this.detached.querySelectorAll("table");
      logger.log("All tables in detached panel:", allTables.length);
      for (let table of allTables) {
        const tb = table.querySelector("tbody");
        if (tbody && tbody.rows.length > 0) {
          const firstRow = tbody.rows[0];
          const cells = Array.from(firstRow.cells);
          const hasProductCode = cells.some(
            (cell) => cell.getAttribute("data-field") === "ProductCode"
          );
          if (hasProductCode) {
            logger.log("Items table found in detached panel:", table);
            return table;
          }
        }
      }
      return null;
    }
    const itemsTable = tables[1];
    logger.log("Items table found:", itemsTable);
    return itemsTable;
  }

  _tryEnterItemsEdit(attempts = 15) {
    if (!this.editing || !this.showItems) return;
    const table = this._getItemsTable();
    if (table) {
      this._enterItemsEdit();
      return;
    }
    if (attempts <= 0) return;
    setTimeout(() => this._tryEnterItemsEdit(attempts - 1), 50);
  }

  _enterHeaderEdit() {
    const tr = this._getHeaderRow();
    if (!tr || !this.header) return;

    const td0 = tr.cells && tr.cells[0];
    if (td0) {
      const val = this.header.SPBNumber || "";
      const raw = val == null ? "" : String(val).replace(/\"/g, "&quot;");
      td0.innerHTML = `<input type="text" class="form-control input-sm sr-input" 
        data-field="SPBNumber" data-scope="header" value="${raw}" style="min-width:160px;"/>`;
    }

    const td1 = tr.cells && tr.cells[1];
    if (td1) {
      const val = this.header.SPBDateOffset || "";
      const dateVal = this.toDateInputValue(val);
      td1.innerHTML = `<input type="date" class="form-control input-sm sr-input" 
        data-field="SPBDateOffset" data-scope="header" value="${dateVal}" style="min-width:160px;"/>`;
    }

    const td2 = tr.cells && tr.cells[2];
    if (td2) {
      const val = this.header.TotalAmountBeforeTax || 0;
      const raw = val == null ? "" : String(val);
      td2.innerHTML = `<input type="number" step="0.01" class="form-control input-sm sr-input" 
        data-field="TotalAmountBeforeTax" data-scope="header" value="${raw}" style="min-width:120px;"/>`;
    }

    const td3 = tr.cells && tr.cells[3];
    if (td3) {
      const val = this.header.ValueAddedTax || 0;
      const raw = val == null ? "" : String(val);
      td3.innerHTML = `<input type="number" step="0.01" class="form-control input-sm sr-input" 
        data-field="ValueAddedTax" data-scope="header" value="${raw}" style="min-width:120px;"/>`;
    }

    const td4 = tr.cells && tr.cells[4];
    if (td4) {
      const val = this.header.TotalAmountAfterTax || 0;
      const raw = val == null ? "" : String(val);
      td4.innerHTML = `<input type="number" step="0.01" class="form-control input-sm sr-input" 
        data-field="TotalAmountAfterTax" data-scope="header" value="${raw}" style="min-width:120px;"/>`;
    }

    const firstInput = tr.querySelector("input.sr-input");
    if (firstInput && firstInput.focus) firstInput.focus();
  }

  _persisHeaderFromInputs() {
    const tr = this._getHeaderRow();
    if (!tr || !this.header) return;

    const inputs = tr.querySelectorAll("input.sr-input[data-scope='header']");
    inputs.forEach((input) => {
      const field = input.getAttribute("data-field");
      if (!field) return;

      let value = input.value;
      if (
        [
          "TotalAmountBeforeTax",
          "ValueAddedTax",
          "TotalAmountAfterTax",
        ].includes(field)
      ) {
        value = value === "" ? null : Number(value);
      } else if (["SPBDateOffset"].includes(field)) {
        value = value || null;
      }

      this.header[field] = value;
    });
  }

  _persistItemsFromInputs() {
    if (!this.showItems || !Array.isArray(this.items)) return;
    const table = this._getItemsTable();
    if (!table) return;

    const inputs = table.querySelectorAll("input.sr-input");
    inputs.forEach((input) => {
      const idx = parseInt(input.getAttribute("data-idx"), 10);
      const field = input.getAttribute("data-field");
      if (isNaN(idx) || !field || !this.items[idx]) return;

      let value = input.value;
      if (["Quantity", "PricePerUnit", "TotalPrice"].includes(field)) {
        value = value === "" ? 0 : Number(value);
      }
      this.items[idx][field] = value;
    });
  }

  _renderHeaderReadOnly() {
    const tr = this._getHeaderRow();
    if (!tr || !this.header) return;

    const td0 = tr.cells && tr.cells[0];
    if (td0) td0.textContent = this.header.SPBNumber || "";

    const td1 = tr.cells && tr.cells[1];
    if (td1)
      td1.textContent = this.formatDateLong(this.header.SPBDateOffset) || "";

    const td2 = tr.cells && tr.cells[2];
    if (td2)
      td2.textContent =
        this.formatNumber(this.header.TotalAmountBeforeTax) || "";

    const td3 = tr.cells && tr.cells[3];
    if (td3)
      td3.textContent = this.formatNumber(this.header.ValueAddedTax) || "";

    const td4 = tr.cells && tr.cells[4];
    if (td4)
      td4.textContent =
        this.formatNumber(this.header.TotalAmountAfterTax) || "";
  }

  _enterItemsEdit() {
    const table = this._getItemsTable();
    if (!table || this.items || !this.items.length) return;
    let rows = table.querySelectorAll("tbody tr");
    if (!rows || rows.length === 0) {
      rows = this.itemsContainer
        ? this.itemsContainer.querySelectorAll(
            ".fixed-table-body table tbody tr"
          )
        : rows;
    }
    rows.forEach((tr, i) => {
      const qTd = tr.cells[2];
      const pTd = tr.cells[3];
      const tTd = tr.cells[4];
      const qRaw =
        this.items[i].Quantity == null || this.items[i].Quantity === undefined
          ? ""
          : String(this.items[i].Quantity);
      const pRaw =
        this.items[i].PricePerUnit == null ||
        this.items[i].PricePerUnit === undefined
          ? ""
          : String(this.items[i].PricePerUnit);
      const tRaw =
        this.items[i].TotalPrice == null ||
        this.items[i].TotalPrice === undefined
          ? ""
          : String(this.items[i].TotalPrice);
      qTd.innerHTML = `<input type="number" class="sr-input" data-field="Quantity" data-idx="${i}" value="${qRaw}"/>`;
      pTd.innerHTML = `<input type="number" class="sr-input" data-field="PricePerUnit" data-idx="${i}" value="${pRaw}"/>`;
      tTd.innerHTML = `<input type="number" class="sr-input" data-field="TotalPrice" data-idx="${i}" value="${tRaw}" readonly/>`;
    });
  }

  showEditedJson() {
    try {
      const snapshot = {
        header: this.header || null,
        items: Array.isArray(this.items) ? this.items : [],
        support: {
          purchaseOrders:
            this.supportRef && Array.isArray(this.supportRef.poRows)
              ? this.supportRef.poRows
              : [],
          deliveryOrders:
            this.supportRef && Array.isArray(this.supportRef.doRows)
              ? this.supportRef.doRows
              : [],
          taxInvoices:
            this.supportRef && Array.isArray(this.supportRef.taxRows)
              ? this.supportRef.taxRows
              : [],
        },
        raw: this.result || null,
      };
      this.editedJsonString = JSON.stringify(snapshot, null, 2);
    } catch (e) {
      this.editedJsonString = `{"error": "Gagal membangun snapshot: ${
        e && e.message ? e.message : e
      }"}`;
    }
  }
}

export default ScanResultData;
