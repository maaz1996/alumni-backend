const router = require('express-promise-router')();
const {
  postTicketValidateBody,
  postTicketSchemas,
} = require('../../validator/ticketValidate');
const askhrController = require('../../controller/askhr/askhr.controller')();
router
    .route('/postticket')
    .post(
        postTicketValidateBody(postTicketSchemas.authSchema),
        (req, res, next) => askhrController.postTicket(req, res, next)
    );
router
    .route('/getticket')
    .post((req, res, next) => askhrController.getTicket(req, res, next));
router
    .route('/postmessage')
    .post((req, res, next) => askhrController.postmessage(req, res, next));
router
    .route('/getmessage')
    .post((req, res, next) => askhrController.getmessage(req, res, next));

router
    .route('/escalate')
    .post((req, res, next) => askhrController.escalate(req, res, next));
router
    .route('/ticketstatus')
    .post((req, res, next) => askhrController.ticketstatus(req, res, next));
router
    .route('/updatemanager')
    .post((req, res, next) => askhrController.updatemanager(req, res, next));
module.exports = router;
