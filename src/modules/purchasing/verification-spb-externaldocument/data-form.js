import {
  bindable,
  computedFrom,
  inject,
  BindingEngine,
  containerless,
} from "aurelia-framework";
import { PLATFORM } from "aurelia-pal";
import { Service, LocalService } from "./service";

var SpbLoader = require("../../../loader/spb-loader");
var CurrencyLoader = require("../../../loader/currency-in-garment-currency-loader");
var IncomeTaxLoader = require("../../../loader/income-tax-loader");
var DivisionLoader = require("../../../loader/division-loader");
var CategoryLoader = require("../../../loader/category-loader");
var VatTaxLoader = require("../../../loader/vat-tax-loader");

@containerless
@inject(Service, LocalService, BindingEngine)
export class DataForm {
  @bindable readOnly = true;
  @bindable data = {};
  @bindable error = {};
  @bindable title;
  @bindable options = { readOnly: true };
  @bindable SPB;
  @bindable title;
  @bindable selectedSupplier;
  @bindable selectedCurrency;
  @bindable selectedIncomeTax;
  @bindable selectedVatTax;
  @bindable selectedDivision;
  @bindable selectedCategory;
  @bindable isImport = false;
  // Toggle to show raw JSON panel; default hidden per request
  showScanJson = false;

  IncomeTaxByOptions = ["", "Supplier", "Dan Liris"];
  termPaymentOptions = [
    "CASH",
    "KREDIT",
    "DP (DOWN PAYMENT) + BP (BALANCE PAYMENT)",
    "DP (DOWN PAYMENT) + TERMIN 1 + BP (BALANCE PAYMENT)",
    "RETENSI",
  ];
  importInfo = ["", "CIF", "FOB", "CNF", "DDU", "DDP", "EX WORK", "OTHERS"];
  controlOptions = {
    label: {
      length: 4,
    },
    control: {
      length: 5,
    },
  };

  itemsInfoReadOnly = {
    columnsReadOnly: [
      {
        header: "Nomor Bon Unit - Nomor Surat Jalan",
        value: "unitReceiptNote.no + ' - ' + unitReceiptNote.deliveryOrderNo",
      },
    ],
    onAdd: function () {
      this.context.ItemsCollection.bind();
      this.data.items.push({ unitReceiptNote: { no: "" } });
    }.bind(this),
  };

  constructor(service, localService) {
    this.service = service;
    this.localService = localService;
    this.uploadVm = PLATFORM.moduleName("./upload/upload");
    this.scanResultVm = PLATFORM.moduleName("./upload/scan-result");
    this.scanResultDataVm = PLATFORM.moduleName("./upload/scan-result-data");
    this.scanResultDataKey = 0;
  }

  bind(context) {
    this.context = context;
    this.data = this.context.data;
    this.error = this.context.error;
    this.options.readOnly = this.readOnly;
    this.scanResult = null;
    this.showScanResultData = true;
    this.calculateTotals();

    if (this.data.items) {
      this.itemsObserver = this.bindingEngine
        .collectionObserver(this.data.items)
        .subscribe(() => {
          this.calculateTotals();
        });
    }
  }

  get spbLoader() {
    return SpbLoader;
  }

  async submitSPB() {
    this.calculateTotals();
    const spbObj = {
      ...this.data,
      ppnValue: this.data.totalVatAmount,
    };
    await this.service.postCompareUPO(spbObj);
  }

  SPBView = (SPB) => {
    return SPB ? SPB.no || "" : "";
  };

  SPBChanged(newValue, oldValue) {
    this.data = newValue;
    this.data.useVat = newValue.useVat;
    this.data.useIncomeTax = newValue.useIncomeTax;
    this.data.vatTax = newValue.vatTax;
    this.data.incomeTax = newValue.incomeTax;
    if (newValue.vatTax) {
      this.selectedVatTax = newValue.vatTax;
    }
    if (newValue.incomeTax) {
      this.selectedIncomeTax = newValue.incomeTax;
    }
    this.useVatChanged();
    this.useIncomeTaxChanged();
    this.calculateTotals();
  }

  calculateTotals() {
    if (!this.data.items) {
      this.data.totalVatAmount = 0;
      this.data.totalIncomeTaxAmount = 0;
      return;
    }

    const jumlah = this.data.items.reduce((total, outerItem) => {
      if (outerItem.unitReceiptNote && outerItem.unitReceiptNote.items) {
        const innerTotal = outerItem.unitReceiptNote.items.reduce(
          (subTotal, innerItem) => {
            const itemTotal =
              (innerItem.pricePerDealUnit || 0) *
              (innerItem.deliveredQuantity || 0);
            return subTotal + itemTotal;
          },
          0
        );
        return total + innerTotal;
      }
      return total;
    }, 0);

    // Hitung PPN
    if (this.data.useVat && this.data.vatTax && this.data.vatTax.rate) {
      const vatRate = parseFloat(this.data.vatTax.rate);
      if (vatRate === 12) {
        this.data.totalVatAmount = (vatRate / 100) * (11 / 12) * jumlah;
      } else {
        this.data.totalVatAmount = jumlah * (vatRate / 100);
      }
    } else {
      this.data.totalVatAmount = 0;
    }

    // Hitung PPh
    if (
      this.data.useIncomeTax &&
      this.data.incomeTax &&
      this.data.incomeTax.rate
    ) {
      const incomeTaxRate = parseFloat(this.data.incomeTax.rate);
      this.data.totalIncomeTaxAmount = jumlah * (incomeTaxRate / 100);
    } else {
      this.data.totalIncomeTaxAmount = 0;
    }

    const beaMasuk = this.SPB.importDuty || 0;
    this.SPB.dppValue = jumlah - beaMasuk;

    // console.log("[DataForm] calculateTotals conditions:", {
    //   useVat: this.data.useVat,
    //   vatTax: this.data.vatTax,
    //   vatRate: this.data.vatTax ? this.data.vatTax.rate : null,
    //   useIncomeTax: this.data.useIncomeTax,
    //   incomeTax: this.data.incomeTax,
    //   incomeTaxRate: this.data.incomeTax ? this.data.incomeTax.rate : null,
    // });
  }

  selectedVatTaxChanged(newValue) {
    this.data.vatTax = newValue;
    this.calculateTotals();
  }

  selectedIncomeTaxChanged(newValue) {
    this.data.incomeTax = newValue;
    this.calculateTotals();
  }

  useIncomeTaxChanged(e) {
    this.selectedIncomeTax = null;
    this.data.incomeTax = {};
    this.data.incomeTaxRate = 0;
    this.data.incomeTaxBy = "";
    this.calculateTotals();
  }

  async useVatChanged(e) {
    //console.log("useVatChanged called, useVat:", this.data.useVat);
    this.selectedVatTax = null;
    this.data.vatTax = {};
    this.data.vatTaxRate = 0;
    if (this.data.useVat) {
      this.data.vatTax = { rate: 12 };
      this.selectedVatTax = { rate: 12 };
      //console.log("Set vatTax to:", this.data.vatTax);
    }
    this.calculateTotals();
  }

  incomeTaxView = (incomeTax) => {
    return `${incomeTax.name} - ${incomeTax.rate}`;
  };

  vatTaxView = (vatTax) => {
    return vatTax.rate ? `${vatTax.rate}` : `${vatTax.Rate}`;
  };

  @computedFrom(
    "data.items",
    "data.totalVatAmount",
    "data.totalIncomeTaxAmount"
  )
  get totalAmount() {
    if (!this.data || !Array.isArray(this.data.items)) {
      console.log(
        "[DataForm] totalAmount: Data atau items tidak valid",
        this.data
      );
      return 0;
    }

    const sumPriceTotal = this.data.items.reduce((sum, item) => {
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

    const ppn = this.data.totalVatAmount || 0;
    const pph = this.data.totalIncomeTaxAmount || 0;
    const total = sumPriceTotal + ppn + pph;

    // console.log("[DataForm] totalAmount calculated:", {
    //   sumPriceTotal,
    //   ppn,
    //   pph,
    //   total,
    // });
    return total;
  }

  get vatTaxLoader() {
    return VatTaxLoader;
  }

  get incomeTaxLoader() {
    return IncomeTaxLoader;
  }

  @computedFrom("SPB")
  get SPBIsSelected() {
    return !!(this.SPB && (this.SPB._id || this.SPB.no || this.SPB.UPONo));
  }

  // Upload handlers are implemented in upload/upload.js
  handleUploadResult = (result) => {
    // Completely destroy the component first
    this.showScanResultData = false;
    this.scanResult = null;
    this.scanResultDataKey++;

    // Wait for DOM to update, then recreate with new data
    setTimeout(() => {
      this.scanResult = result;
      this.scanResultDataKey++;
      this.showScanResultData = true; // Recreate component
    }, 150);

    try {
      if (!result) {
        // Best-effort: collapse items in child view to avoid stale DOM
        if (this.scanResultDataVm && this.scanResultDataVm.viewModel) {
          const vm = this.scanResultDataVm.viewModel;
          vm.showItems = false;
          vm.header = null;
          vm.items = [];
          vm.headerData = [];
        }
      }
    } catch (_) {}
  };

  handleFileSelected = (file) => {
    this.selectedFile = file;
  };
}
