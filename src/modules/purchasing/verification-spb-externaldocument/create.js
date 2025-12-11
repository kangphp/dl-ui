import { inject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { Service, LocalService } from "./service";

@inject(Router, Service, LocalService)
export class Create {
  isScanning = false;
  constructor(router, service, localService) {
    this.router = router;
    this.service = service;
    this.localService = localService;
  }

  bind() {
    this.data = {};
    this.error = {};
  }

  cancel(event) {
    if (confirm(`Apakah Anda yakin akan kembali?`))
      this.router.navigateToRoute("list");
  }

  async save(event) {
    const dataForm = this.dataFormRef;
    let selected = dataForm && dataForm.SPB ? dataForm.SPB : null;
    if (!selected || !(selected.UPONo || selected._id)) {
      console.log("dataForm:", dataForm);
      console.log("Selected UPO:", selected);
      alert("Anda harus memilih Nomor Surat Perintah Bayar terlebih dahulu.");
      return;
    }

    const scanResult = dataForm && dataForm.scanResult;
    const file = dataForm && dataForm.selectedFile;
    if (!scanResult && !file) {
      alert("Pastikan anda mengupload File Dokumen Eksternal");
      return;
    }

    this.isScanning = true;
    try {
      console.log("[Verifikasi SPB] JSON UPO yang akan dikirim:");
      console.log(JSON.stringify(selected, null, 2));

      let scanResultToSend = {};

      if (scanResult) {
        let raw = scanResult;
        if (typeof scanResult === "object" && scanResult.result) {
          raw = scanResult.result;
        }
        const root = raw.data || raw.Data || raw;
        console.log(
          "Root data dari scanResult:",
          JSON.stringify(root, null, 2)
        );

        let upo = {};
        if (root.UPO) {
          upo = {
            Header: root.UPO.Header || root.UPO.header || {},
            Items: root.UPO.Items || root.UPO.items || [],
          };
        } else {
          upo = {
            Header: root.header || {},
            Items: root.items || [],
          };
        }

        let invoice = { Invoice: [] };
        if (root.Invoice && Array.isArray(root.Invoice.Invoice)) {
          invoice.Invoice = root.Invoice.Invoice;
        } else if (root.Invoice && Array.isArray(root.Invoice)) {
          invoice.Invoice = root.Invoice;
        }

        let unitReceiptNote = {};
        if (root.UnitReceiptNote) {
          unitReceiptNote = {
            URNHeader: root.UnitReceiptNote.URNHeader || {},
            URNItem: root.UnitReceiptNote.URNItem || [],
          };
        } else {
          unitReceiptNote = {
            URNHeader: root.URNHeader || {},
            URNItem: root.URNItem || [],
          };
        }

        let purchaseOrder = { POs: [], TotalAmount: 0 };
        const poSource =
          (root.PurchaseOrder && root.PurchaseOrder.POs) || root.POs || [];
        if (Array.isArray(poSource)) {
          purchaseOrder.POs = poSource.map((x) => ({
            POHeader: {
              PurchaseOrderNumber:
                (x.POHeader && x.POHeader.PurchaseOrderNumber) || "",
              GrandTotalAfterTax:
                (x.POHeader && x.POHeader.GrandTotalAfterTax) || 0,
            },
            POItems: Array.isArray(x.POItems) ? x.POItems : [],
          }));

          purchaseOrder.TotalAmount = purchaseOrder.POs.reduce(
            (sum, po) =>
              sum + ((po.POHeader && po.POHeader.GrandTotalAfterTax) || 0),
            0
          );
        }

        let purchaseRequest = { PRs: [] };
        const prSource =
          (root.PurchaseRequest && root.PurchaseRequest.PRs) || root.PRs || [];
        if (Array.isArray(prSource)) {
          purchaseRequest.PRs = prSource.map((x) => ({
            PurchaseRequestNumber: x.PurchaseRequestNumber || "",
            ItemName: x.ItemName || "",
            Quantity: x.Quantity || 0,
          }));
        } else {
          purchaseRequest.PRs = [];
        }

        let taxInvoice = { TaxInvoice: {} };
        if (root.TaxInvoice && root.TaxInvoice.TaxInvoice) {
          taxInvoice.TaxInvoice = root.TaxInvoice.TaxInvoice;
        }

        scanResultToSend = {
          UPO: upo,
          Invoice: invoice,
          UnitReceiptNote: unitReceiptNote,
          PurchaseOrder: purchaseOrder,
          PurchaseRequest: purchaseRequest,
          TaxInvoice: taxInvoice,
        };

        if (
          scanResultToSend.UnitReceiptNote &&
          Array.isArray(scanResultToSend.UnitReceiptNote.URNItem) &&
          scanResultToSend.UnitReceiptNote.URNItem.length === 0
        ) {
          delete scanResultToSend.UnitReceiptNote;
        }

        console.log(
          "[Verifikasi SPB] ScanResult (template) yang akan dikirim:",
          JSON.stringify(scanResultToSend, null, 2)
        );
      } else if (file) {
        console.log("[Verifikasi SPB] File PDF yang dipilih:", file.name);
      }

      const response = await this.localService.postCompareUPO(selected, {
        scanResult: scanResultToSend ? JSON.stringify(scanResultToSend) : null,
        file: file,
      });

      if (
        scanResultToSend &&
        scanResultToSend.Invoice &&
        scanResultToSend.Invoice.Invoice &&
        scanResultToSend.Invoice.Invoice.length > 0
      ) {
        window.scannedInvoiceNo =
          scanResultToSend.Invoice.Invoice[0].InvoiceNumber;
      }

      this.isScanning = false;

      let status = response && (response.status || response.statusCode);
      if (typeof status === "string") status = parseInt(status);
      if (status === 200) {
        if (window.confirm("Selamat Hasil Pengecekan Dokumen SPB Sama!")) {
          this.router.navigateToRoute("list");
        }
      } else if (status === 201) {
        if (
          window.confirm(
            "Hasil Pengecekan Data Selesai, Terdapat Data yang berbeda."
          )
        ) {
          this.router.navigateToRoute("list");
        }
      } else {
        if (window.confirm("Hasil pengecekan selesai.")) {
          this.router.navigateToRoute("list");
        }
      }
    } catch (e) {
      this.isScanning = false;
      const msg =
        e && e.message ? e.message : "Terjadi masalah, jangan panik coba lagi";
      window.alert(msg);
    }
  }
}
