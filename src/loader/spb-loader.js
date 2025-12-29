import { Container } from 'aurelia-dependency-injection';
import { Config } from "aurelia-api";   

const resource = 'unit-payment-orders/spb';

module.exports = function (keyword, filter) {

    var config = Container.instance.get(Config);
    var endpoint = config.getEndpoint("purchasing-azure");

    return endpoint.find(resource, { keyword: keyword, size: 10 })
        .then(results => {
            return results.data.map(spb => {
                spb.no = spb.no;
                spb.purchaseOrders = spb.items && spb.items.length > 0 
                    ? spb.items.flatMap(item => 
                        item.unitReceiptNote && item.unitReceiptNote.items 
                            ? item.unitReceiptNote.items.map(urnItem => urnItem.EPONo ? urnItem.EPONo.trim() : '') 
                            : []
                      ).filter(po => po).join(", ")
                    : "";
                return spb;
            });
        });
}