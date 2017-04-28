/**
 * Created by cnzhao on 16/1/28.
 */

var express = require('express');
var router = express.Router();
var forms = require('forms');
var fields = forms.fields;
var validators = forms.validators;
var common = require('common');
var commonSetting = common.commonSetting;
var commonConst = common.commonConst;
var util = require('util');
var CompanyType = common.protoHelper.CompanyType;
var BodyProto = common.protoHelper.BodyProto;
var DefineProto = common.protoHelper.DefineProto;
var ErrorCode = common.protoHelper.DefineProto.ErrorCode;

/* Login page. */
router.route('/login').get(function (req, res) {
    var loginSession = req.cookies.loginSession;
    var loginInfo = req.cookies.loginInfo;
    var loginAccount = req.cookies.loginAccount;
    var info = req.session.info;
    req.session.info = null;
    if (loginSession && loginInfo) {
        var url = util.format("%s/auth/login.pb", commonSetting.WEB_HTTP_URL);
        var httpHelper = common.serverHelper.httpHelper;
        var tokenId = req.cookies[commonConst.WEB_SESSION_TAG];
        httpHelper.post(url, {
            user: loginInfo.mobile ? loginInfo.mobile : loginInfo.accountFunding,
            login_session: loginSession,
            company_type: CompanyType.CT_FC
        }, tokenId, function (err, httpResponse, body) {
            if (err) {
                res.render('templates/login.html',{account:loginAccount});
            }
            else {
                var resp = BodyProto.WebCustomerLoginResp.decode(body);
                if (resp.errorCode == ErrorCode.Success) {
                    // 自动登录成功
                    res.redirect('/');
                }
                else {
                    res.render('templates/login.html',{account:loginAccount});
                }
            }
        });
    } else {
        res.render('templates/login.html', {title: '超盈1号-用户登录', account:loginAccount, info:info});
    }

}).post(function (req, res) {
    var loginForm = forms.create({
        keepcheck: fields.string(),
        username: fields.string({required: true}),
        password: fields.password({
            required: true,
            validators: [validators.minlength(4), validators.maxlength(16)]
        })
    });

    loginForm.handle(req, {
        success: function (form) {
            var url = util.format("%s/auth/login.pb", commonSetting.WEB_HTTP_URL);
            var httpHelper = common.serverHelper.httpHelper;
            httpHelper.post(url, {
                user: form.data.username,
                password: form.data.password,
                company_type: CompanyType.CT_FC
            }, null, function (err, httpResponse, body) {
                var resp = BodyProto.WebCustomerLoginResp.decode(body);
                if (resp.errorCode == ErrorCode.Success) {
                    console.info(resp.loginSession,resp.loginInfo);

                    res.cookie(commonConst.WEB_SESSION_TAG, resp.tokenId, {expires: new Date(Date.now() + commonConst.COOKIE_NEVER_EXPIRE)});

                    var loginSession = resp.loginSession;
                    var loginInfo = resp.loginInfo;
                    if(form.data.keepcheck) {
                        res.cookie('loginInfo', loginInfo, {expires: new Date(Date.now() + commonConst.COOKIE_NEVER_EXPIRE)});
                        res.cookie('loginSession', loginSession, {expires: new Date(Date.now() + commonConst.COOKIE_NEVER_EXPIRE)});
                        res.cookie('loginAccount', form.data.username, {expires: new Date(Date.now() + commonConst.COOKIE_NEVER_EXPIRE)});
                    } else {
                        res.clearCookie('loginInfo');
                        res.clearCookie('loginSession');
                        res.clearCookie('loginAccount');
                    }
                    if (loginInfo.level == DefineProto.CustomerLevel.CL_Diamond
                        || loginInfo.level == DefineProto.CustomerLevel.CL_King) {
                        res.redirect('/');
                    } else {
                        res.render('templates/login.html', {title: '用户登录', errorCode: ErrorCode.NotPermission, account:form.data.username});
                    }
                }
                else {
                    res.render('templates/login.html', {title: '用户登录', errorCode: resp.errorCode, account:form.data.username});
                }
            });
        },
        other: function (form) {
            res.render('templates/login.html', {title: '用户登录', errorCode: ErrorCode.Failed, account:form.data.username});
        }
    });

});

/* Forget password page */
router.route('/forget').get(function (req, res) {
    res.render('templates/forget.html', {title: '超盈1号-忘记密码'});
}).post(function (req, res) {
    var forgetForm = forms.create({
        phonenumber: fields.string({required: true, label: 'PhoneNumber'}),
        authcode: fields.number({required: true, label: 'AuthCode'}),
        password: fields.password({
            required: true,
            validators: [validators.minlength(4), validators.maxlength(16)]
        })
    });

    var loginAccount = req.cookies.loginAccount;
    forgetForm.handle(req, {
        success: function (form) {
            var tokenId = req.cookies[commonConst.WEB_SESSION_TAG];
            var url = util.format("%s/auth/forget_password.pb", commonSetting.WEB_HTTP_URL);
            var httpHelper = common.serverHelper.httpHelper;
            httpHelper.post(url, {
                mobile: form.data.phonenumber,
                validate_no: form.data.authcode,
                password: form.data.password,
                repeat_password: form.data.password,
                company_type: CompanyType.CT_FC
            }, tokenId, function (err, httpResponse, body) {
                var resp = BodyProto.ForgetPasswordResp.decode(body);
                if (resp.errorCode == ErrorCode.Success) {
                    console.info("密码修改成功，请使用新密码登录");
                    req.session.info = "密码修改成功，请使用新密码登录";
                    res.redirect('auth/login');
                }
                else {
                    console.info("密码修改 " + resp.errorCode);
                    res.render('templates/forget.html', {title: '超盈1号-忘记密码', errorCode: resp.errorCode});
                }
            });
        },
        other: function (form) {
            res.render('templates/forget.html', {title: '超盈1号-忘记密码', errorCode: ErrorCode.Failed});
        }
    });
});


/* GET logout page. */
router.get("/logout", function (req, res) {
    // 到达 /logout 路径则登出， session中user,error对象置空，并重定向到根路径
    req.session.userInfo = null;
    res.clearCookie(commonConst.WEB_SESSION_TAG);
    res.clearCookie('loginInfo');
    res.clearCookie('loginSession');
    res.redirect("/login");
});

module.exports = router;
