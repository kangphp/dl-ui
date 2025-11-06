import { Aurelia, inject } from 'aurelia-framework';
import { AuthService } from "aurelia-authentication";
import '../styles/signin.css';
import JSEncrypt from 'jsencrypt';
import LOGIN_CONFIG from '../login-config';

@inject(AuthService)
export class Login {
    // username = "dev";
    // password = "Standar123";

    username="";
    password="";
    error = false;
    disabledButton = false;
    
    constructor(authService) {
        this.authService = authService;
    }

    // Redirect to standalone login page if configured
    attached() {
        // Check if we should use standalone login
        if (LOGIN_CONFIG.mode === 'standalone') {
            // Use replace() to avoid keeping hash in URL
            // Get base URL without hash
            const baseUrl = window.location.origin;
            const loginUrl = baseUrl + LOGIN_CONFIG.standaloneLoginUrl;
            window.location.replace(loginUrl);
            return;
        }
    }

    login() {
        this.error = false;
        this.disabledButton = true;
        const PUBLIC_KEY =`-----BEGIN PUBLIC KEY-----MIIBCgKCAQEAyUDO910BLcBrwdscKorajZKQJdR9TNnR/oqNcTpL10C4Ts9JQq4djGlcxdIG09rm23x5r54/eFmthu4lpeSBEPsS9O4ai0SF0mA39n5lvfNzWJ/JNBYswXU0S2BoTKdClbme+Z1hhqwksej+y2r+AzxiUay23Tn/AvIRxmPQg/66lD6zNyTWHOHAowhdOLUF8GagwdNOeCC0BZDdjP7Iyrk0d5XYeffMAcNR2vLTDpreMcjda7fGHbDTu8khsFTpFDwub0Pg96lxbFV9i//dZ7sPl+RpIrrLV9alCuDyz4+86Sl1jVqbwyh4j4XjgYck1CcmDg5cWN5iB9MnHJZaAQIDAQAB-----END PUBLIC KEY-----`;
        
        const credentials = {
            username: this.username,
            password: this.password,
            nonce: crypto.randomUUID(),
            timestamp: new Date().toISOString()
        };

        const encryptor = new JSEncrypt.JSEncrypt();
        encryptor.setPublicKey(PUBLIC_KEY);
        const authEncrypted = encryptor.encrypt(JSON.stringify(credentials));
        //return this.authService.login({ "username": this.username, "password": this.password })
        return this.authService.login({ authEncrypted })
            .then(response => {
                console.log("success logged " + response);
                // location.reload();
            })
            .catch(err => {
                this.error = true;
                this.disabledButton = false;
                // console.log(err);
                console.log("login failure");
            });
    }
} 