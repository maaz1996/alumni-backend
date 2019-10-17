const router = require('express-promise-router')();
const passport = require('passport');
const AdminController = require('../../../controller/admin/actions.admin.controller');
require('../../../validator/admin.passport');
// adminRouter Navigations

router.route('/add/company').post(AdminController.add);
router
    .route("/add/news")
    .get((req, res, next) => AdminController.viewNews(req, res, next))
router
    .route('/allnews')
    .get((req, res, next) => AdminController.viewallNews(req, res, next));
router
    .route('/updatenews')
    .post((req, res, next) => AdminController.updateNews(req, res, next));
router
    .route('/deletenews')
    .delete((req, res, next) => AdminController.deleteNews(req, res, next));
router
    .route("/add/event")
    .get((req, res, next) => AdminController.viewEvents(req, res, next))

router
    .route('/allevent')
    .get((req, res, next) => AdminController.viewallEvents(req, res, next));
router
    .route('/updateevent')
    .post((req, res, next) => AdminController.updateEvents(req, res, next));
router
    .route('/deleteevent')
    .delete((req, res, next) => AdminController.deleteEvents(req, res, next));

router    
    .route("/add/faq")
    .get((req, res, next) => AdminController.viewFaq(req, res, next))

router
    .route('/allfaq')
    .get((req, res, next) => AdminController.viewallFaq(req, res, next));
router
    .route('/updatefaq')
    .post((req, res, next) => AdminController.updatefaq(req, res, next));
router
    .route('/deletefaq')
    .delete((req, res, next) => AdminController.deleteFaq(req, res, next));
router
    .route('/alumni')
    .post((req, res, next) => AdminController.createalumni(req, res, next))
    .get((req, res, next) => AdminController.viewalumni(req, res, next));
router
    .route('/updatealumni')
    .post((req, res, next) => AdminController.updatealumni(req, res, next));
router
    .route('/allalumni')
    .get((req, res, next) => AdminController.allalumni(req, res, next));
router
    .route('/deletealumni')
    .delete((req, res, next) => AdminController.deletealumni(req, res, next));
router
    .route('/userupload')
    .post((req, res, next) => AdminController.userupload(req, res, next));
router
    .route('/documentupload')
    .post((req, res, next) => AdminController.documentupload(req, res, next))
    .get((req, res, next) => AdminController.viewdocument(req, res, next));
router
    .route('/ask-hr')
    .post((req, res, next) => AdminController.askHr(req, res, next));

module.exports = router;
