import { inject } from "aurelia-framework";
import { RestService } from "../../../utils/rest-service";

const serviceUri = "spb-revision";
const serviceUriScan = "spb-revision/scan-spb";
const compareUpoUri = "spb-revision/compare-spb";

@inject()
export class Service extends RestService {
  constructor(http, aggregator, config, endpoint) {
    super(http, aggregator, config, "purchasing-azure");
  }

  search(info) {
    var endpoint = `${serviceUri}`;
    return super.list(endpoint, info);
  }

  getSPBData(spbId) {
    console.log("Getting SPB data for ID:", spbId);
    var endpoint = `${serviceUri}/${spbId}`;
    return super
      .get(endpoint)
      .then((data) => {
        console.log("SPB data received:", data);
        return data;
      })
      .catch((error) => {
        console.error("Error getting SPB data:", error);
        throw error;
      });
  }

  uploadFile(file) {
    if (!file) {
      return Promise.reject(new Error("File is required"));
    }
    const formData = new FormData();
    formData.append("file", file);
    return this.endpoint.client
      .fetch(serviceUriScan, {
        method: "POST",
        body: formData,
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Upload failed: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      });
  }

  /**
   * @param {object} spbObj
   * @param {object} options
   */

  // postCompareUPO(spbObj, options = {}) {
  //   const { scanResult = null, file = null } = options;

  //   if (!spbObj) {
  //     alert("SPB data is required");
  //     return Promise.reject(new Error("SPB data is required"));
  //   }

  //   const mappedUPO = {
  //     UPOId: spbObj._id || spbObj.UId || null,
  //     SPBNumber: spbObj.no || "",
  //     SPBDate: spbObj.date || "",
  //     PaymentMethod: spbObj.paymentMethod || "",
  //     InvoiceNo: spbObj.invoiceNo || "",
  //     InvoiceDate: spbObj.invoiceDate || "",
  //     PPHValue: spbObj.PPHValue || 0,
  //     PPNValue: spbObj.PPNValue || 0,
  //     TotalAmount: spbObj.totalAmount || 0,
  //     TaxInvoiceNumber: spbObj.vatNo || "",
  //     Items: Array.isArray(spbObj.items)
  //       ? spbObj.items.map((item) => {
  //           const urn = item.unitReceiptNote || {};
  //           return {
  //             URNNo: urn.no || "",
  //             DONo: urn.deliveryOrder ? urn.deliveryOrder.no || "" : "",
  //             details: Array.isArray(urn.items)
  //               ? urn.items.map((detail) => ({
  //                   PONo: detail.EPONo || "",
  //                   PRNo: detail.PRNo || "",
  //                   ItemId: detail._id || detail.Id || "",
  //                   ItemName: (detail.product && detail.product.name) || "",
  //                   Price: detail.pricePerDealUnit || 0,
  //                   ItemCategory: detail.ItemCategory || "",
  //                   TotalPrice: detail.priceTotal || 0,
  //                   Quantity: detail.QuantityCorrection || 0,
  //                 }))
  //               : [],
  //           };
  //         })
  //       : [],
  //   };

  //   // console.log("Isi yang dikirim:", mappedUPO);

  //   const formData = new FormData();
  //   formData.append("UPO", JSON.stringify(mappedUPO));

  //   if (scanResult) {
  //     formData.append("scanResult", scanResult);
  //   }

  //   if (file) {
  //     formData.append("file", file);
  //   }

  //   if (!scanResult && !file) {
  //     alert("Either scanResult or file must be provided");
  //     return Promise.reject(
  //       new Error("Either scanResult or file must be provided")
  //     );
  //   }

  //   return this.endpoint.client
  //     .fetch(compareUpoUri, {
  //       method: "POST",
  //       body: formData,
  //     })
  //     .then((response) => {
  //       if (!response.ok) {
  //         return response
  //           .json()
  //           .then((err) => {
  //             console.log("Backend error detail:", err);
  //             throw new Error(
  //               `Compare UPO failed: ${response.status} - ${
  //                 err.message || JSON.stringify(err)
  //               }`
  //             );
  //           })
  //           .catch(() => {
  //             throw new Error(
  //               `Compare UPO failed: ${response.status} ${response.statusText}`
  //             );
  //           });
  //       }
  //       return response.json();
  //     })
  //     .catch((error) => {
  //       console.error("Error detail:", error);
  //       alert(error.message);
  //       throw error;
  //     });
  // }

  postCompareUPO(spbObj, options = {}) {
    const { scanResult = null, file = null } = options;

    if (!spbObj) {
      alert("SPB data is required");
      return Promise.reject(new Error("SPB data is required"));
    }

    // Kirim objek asli tanpa mapping ulang
    const formData = new FormData();
    formData.append("UPO", JSON.stringify(spbObj));

    if (scanResult) {
      formData.append("scanResult", scanResult);
    }

    if (file) {
      formData.append("file", file);
    }

    if (!scanResult && !file) {
      alert("Either scanResult or file must be provided");
      return Promise.reject(
        new Error("Either scanResult or file must be provided")
      );
    }

    return this.endpoint.client
      .fetch(compareUpoUri, {
        method: "POST",
        body: formData,
      })
      .then((response) => {
        if (!response.ok) {
          return response
            .json()
            .then((err) => {
              console.log("Backend error detail:", err);
              throw new Error(
                `Compare UPO failed: ${response.status} - ${
                  err.message || JSON.stringify(err)
                }`
              );
            })
            .catch(() => {
              throw new Error(
                `Compare UPO failed: ${response.status} ${response.statusText}`
              );
            });
        }
        return response.json();
      })
      .catch((error) => {
        console.error("Error detail:", error);
        alert(error.message);
        throw error;
      });
  }

  /**
   *
   * @param {string} id
   */

  getSPBRevisionById(id) {
    var endpoint = `${serviceUri}/${id}`;
    return super.get(endpoint);
  }

  /**
   *
   * @param {string} id
   */
  delete(id) {
    const endpoint = `${serviceUri}/${id}`;
    return super.delete(endpoint);
  }
}

export class LocalService extends RestService {
  constructor(http, aggregator, config, endpoint) {
    super(http, aggregator, config, "purchasing-local-azure");
  }

  uploadFile(file) {
    if (!file) {
      return Promise.reject(new Error("File is required"));
    }
    const formData = new FormData();
    formData.append("file", file);
    return this.endpoint.client
      .fetch(serviceUriScan, {
        method: "POST",
        body: formData,
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Upload failed: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      });
  }

  /**
   * @param {object} spbObj
   * @param {object} options
   */

  // postCompareUPO(spbObj, options = {}) {
  //   const { scanResult = null, file = null } = options;

  //   if (!spbObj) {
  //     alert("SPB data is required");
  //     return Promise.reject(new Error("SPB data is required"));
  //   }

  //   const mappedUPO = {
  //     UPOId: spbObj._id || spbObj.UId || null,
  //     SPBNumber: spbObj.no || "",
  //     SPBDate: spbObj.date || "",
  //     PaymentMethod: spbObj.paymentMethod || "",
  //     InvoiceNo: spbObj.invoiceNo || "",
  //     InvoiceDate: spbObj.invoiceDate || "",
  //     PPHValue: spbObj.PPHValue || 0,
  //     PPNValue: spbObj.PPNValue || 0,
  //     TotalAmount: spbObj.totalAmount || 0,
  //     TaxInvoiceNumber: spbObj.vatNo || "",
  //     Items: Array.isArray(spbObj.items)
  //       ? spbObj.items.map((item) => {
  //           const urn = item.unitReceiptNote || {};
  //           return {
  //             URNNo: urn.no || "",
  //             DONo: urn.deliveryOrder ? urn.deliveryOrder.no || "" : "",
  //             details: Array.isArray(urn.items)
  //               ? urn.items.map((detail) => ({
  //                   PONo: detail.EPONo || "",
  //                   PRNo: detail.PRNo || "",
  //                   ItemId: detail._id || detail.Id || "",
  //                   ItemName: (detail.product && detail.product.name) || "",
  //                   Price: detail.pricePerDealUnit || 0,
  //                   ItemCategory: detail.ItemCategory || "",
  //                   TotalPrice: detail.priceTotal || 0,
  //                   Quantity: detail.QuantityCorrection || 0,
  //                 }))
  //               : [],
  //           };
  //         })
  //       : [],
  //   };

  //   console.log("Isi yang dikirim:", mappedUPO);

  //   const formData = new FormData();
  //   formData.append("UPO", JSON.stringify(mappedUPO));

  //   if (scanResult) {
  //     formData.append("scanResult", scanResult);
  //   }

  //   if (file) {
  //     formData.append("file", file);
  //   }

  //   if (!scanResult && !file) {
  //     alert("Either scanResult or file must be provided");
  //     return Promise.reject(
  //       new Error("Either scanResult or file must be provided")
  //     );
  //   }

  //   return this.endpoint.client
  //     .fetch(compareUpoUri, {
  //       method: "POST",
  //       body: formData,
  //     })
  //     .then((response) => {
  //       if (!response.ok) {
  //         return response
  //           .json()
  //           .then((err) => {
  //             console.log("Backend error detail:", err);
  //             throw new Error(
  //               `Compare UPO failed: ${response.status} - ${
  //                 err.message || JSON.stringify(err)
  //               }`
  //             );
  //           })
  //           .catch(() => {
  //             throw new Error(
  //               `Compare UPO failed: ${response.status} ${response.statusText}`
  //             );
  //           });
  //       }
  //       return response.json();
  //     })
  //     .catch((error) => {
  //       console.error("Error detail:", error);
  //       alert(error.message);
  //       throw error;
  //     });
  // }

  postCompareUPO(spbObj, options = {}) {
    const { scanResult = null, file = null } = options;

    if (!spbObj) {
      alert("SPB data is required");
      return Promise.reject(new Error("SPB data is required"));
    }

    // Kirim objek asli tanpa mapping ulang
    const formData = new FormData();
    formData.append("UPO", JSON.stringify(spbObj));

    console.log("Isi yang dikirim:", spbObj);

    if (scanResult) {
      formData.append("scanResult", scanResult);
    }

    if (file) {
      formData.append("file", file);
    }

    if (!scanResult && !file) {
      alert("Either scanResult or file must be provided");
      return Promise.reject(
        new Error("Either scanResult or file must be provided")
      );
    }

    return this.endpoint.client
      .fetch(compareUpoUri, {
        method: "POST",
        body: formData,
      })
      .then((response) => {
        if (!response.ok) {
          return response
            .json()
            .then((err) => {
              console.log("Backend error detail:", err);
              throw new Error(
                `Compare UPO failed: ${response.status} - ${
                  err.message || JSON.stringify(err)
                }`
              );
            })
            .catch(() => {
              throw new Error(
                `Compare UPO failed: ${response.status} ${response.statusText}`
              );
            });
        }
        return response.json();
      })
      .catch((error) => {
        console.error("Error detail:", error);
        alert(error.message);
        throw error;
      });
  }

  search(info) {
    var endpoint = `${serviceUri}`;
    return super.list(endpoint, info);
  }

  /**
   *
   * @param {string} id
   */
  delete(id) {
    const endpoint = `${serviceUri}/${id}`;
    return super.delete(endpoint);
  }
}
