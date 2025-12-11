export class Index {
    configureRouter(config, router) {
        config.map([
            { route: ['', 'list'], moduleId: './list', name: 'list', nav: false, title: 'List: Verifikasi SPB External Document' },
            { route: 'create', moduleId: './create', name: 'create', nav: false, title: 'Create: Verifikasi SPB External Document' },
            { route: 'view/:id', moduleId: './view', name: 'view', nav: false, title: 'View: Verifikasi SPB External Document' },
        ]);

        this.router = router;
    }
}