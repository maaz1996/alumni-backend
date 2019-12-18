/* eslint-disable max-len */
const decodetoken = require('../utils/jwt.decode')();
const Ticket = require('../models/askhr/tickets');
const Message = require('../models/askhr/message');
const User = require('../models/user/auth');
const Notification = require('../models/askhr/notification');
const Utils = require('../utils/getFirstMessageDateFromTicket')();
const emailUtil = require('../utils/emailservices')();
const Manager = require('../models/askhr/managers');
module.exports = () => {
  const postTicket = ({payload, token}) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          participants,
          created_by,
          updated_by,
          title,
          messagebody,
          esclation,
          resolved_status,
        } = payload;
        const expirytimefromtoken = await decodetoken.decodejwt(token);
        if (Date.now() > expirytimefromtoken) {
          resolve('tokenexpired');
        } else {
          const firstmessage = new Message({
            senders: created_by,
            message: messagebody,
            created_at: Date.now(),
          });
          const savedmsg = await firstmessage.save();
          const getmanager = await Manager.find({});
          let manager1id;
          let manager2id;
          let manager3id;
          // console.log(getmanager[0].level);
          // getmanager = JSON.parse(JSON.stringify({ ...getmanager }));
          for (let i = 0; i < getmanager.length; i++) {
            if (getmanager[i].level == 'esclation_manager_1') {
              manager1id = getmanager[i].esclation_manager_id;
            }
            if (getmanager[i].level == 'esclation_manager_2') {
              manager2id = getmanager[i].esclation_manager_id;
            }
            if (getmanager[i].level == 'esclation_manager_3') {
              manager3id = getmanager[i].esclation_manager_id;
            }
          }
          const responseTicket = new Ticket({
            participants,
            created_at: Date.now(),
            created_by,
            updated_by,
            title,
            message: savedmsg._id,
            esclation,
            esclation_manager_1: manager1id,
            esclation_manager_2: manager2id,
            esclation_manager_3: manager3id,
            resolved_status,
          });
          const result = await responseTicket.save();
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  };
  const getTicket = ({payload, token}) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {_id, skip, limit} = payload;
        const expirytimefromtoken = await decodetoken.decodejwt(token);
        if (Date.now() > expirytimefromtoken) {
          resolve('tokenexpired');
        } else {
          const result = await Ticket.findOne({_id})
              .populate({
                path: 'esclation_manager_1',
                select: {_id: 1, userType: 1},
              })
              .populate({
                path: 'message',
                select: {_id: 0, senders: 1, message: 1, created_at: 1},
                options: {
                  limit: limit,
                  skip: skip,
                  sort: {created_at: 1},
                },
                populate: {path: 'senders', select: {_id: 0, userType: 1}},
              });
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const postmessage = ({payload, token}) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {senders, message, ticket_id} = payload;
        const expirytimefromtoken = await decodetoken.decodejwt(token);
        if (Date.now() > expirytimefromtoken) {
          resolve('tokenexpired');
        } else {
          // Creating a new message and saving it in message schema
          const newMessage = new Message({
            senders,
            message,
            created_at: Date.now(),
          });
          const response = await newMessage.save();

          // Getting the Objec_Id of the message created
          const message_id = response._id;

          // Getting the ticket corresponding to our message using the ticket_id comming from payload
          const responseTicket = await Ticket.findOne({_id: ticket_id});

          // Concat the newly created Object_Id of the message into the ticket message field
          responseTicket.message = responseTicket.message.concat(message_id);

          // Save the ticket
          await responseTicket.save();

          resolve(response);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const getmessage = ({payload, token}) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {skip, limit} = payload;
        const expirytimefromtoken = await decodetoken.decodejwt(token);
        if (Date.now() > expirytimefromtoken) {
          resolve('tokenexpired');
        } else {
          const result = await Message.find({})
              .populate('senders', {
                userType: 1,
                _id: 0,
              })
              .skip(skip)
              .limit(limit);
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const escalate = ({payload, token}) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {_id, esclation_manager} = payload;
        const expirytimefromtoken = await decodetoken.decodejwt(token);
        if (Date.now() > expirytimefromtoken) {
          resolve('tokenexpired');
        } else {
          const escalationDate = await Utils.getFirstMessageDateFromTicket(_id);

          // Saveing current date in a variable and converitng into epoch
          const date = new Date(Date.now());
          const currentDate = date.setDate(date.getDate() + 0);
          // console.log(escalationDate);
          // console.log(currentDate);
          if (escalationDate > currentDate) {
            let [findticket] = await Ticket.find({_id});
            // console.log(findticket);
            if (findticket) {
              if (findticket.esclation_manager == 'esclation_manager_2') {
                const id = findticket.esclation_manager_2;
                const finduser = await User.findOne({_id: id});
                const sendmailfornotification = await emailUtil.emailserivesfornotification(
                    finduser.email
                );
                const savenotification = new Notification({
                  user: id,
                  content:
                    'Notification trigerred, Please look into the matter posted at your dashboard',
                });
                await savenotification.save();
              } else if (
                findticket.esclation_manager == 'esclation_manager_3'
              ) {
                const id = findticket.esclation_manager_3;
                const finduser = await User.findOne({_id: id});
                const sendmailfornotification = await emailUtil.emailserivesfornotification(
                    finduser.email
                );
                const savenotification = new Notification({
                  user: id,
                  content: 'Please notification aa gya',
                });
                await savenotification.save();
              }
              findticket = await findticket.updateOne(
                  {
                    esclation: 'false',
                    esclation_manager: esclation_manager,
                  },
                  {
                    new: true,
                  }
              );
            }

            resolve('E');
          } else {
            resolve('DE');
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  };
  const ticketstatus = ({payload, token}) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {_id, resolved_status} = payload;
        const expirytimefromtoken = await decodetoken.decodejwt(token);
        if (Date.now() > expirytimefromtoken) {
          resolve('tokenexpired');
        } else {
          let [result] = await Ticket.find({_id: _id});
          if (result) {
            result = await result.updateOne(
                {
                  resolved_status: resolved_status,
                },
                {
                  new: true,
                }
            );
          }
          result.ok == 1 ? resolve('success') : reject(error);
        }
      } catch (error) {
        reject(error);
      }
    });
  };
  // Update the manager i.e escalation_1; escalation_2; escaltion_3
  const updatemanager = ({payload, token}) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {new_manager_obejctid, level} = payload;
        // console.log(payload);
        const expirytimefromtoken = await decodetoken.decodejwt(token);
        if (Date.now() > expirytimefromtoken) {
          resolve('tokenexpired');
        } else {
          let [result] = await Manager.find({level: level});

          if (result) {
            result = await result.updateOne(
                {
                  esclation_manager_id: new_manager_obejctid,
                },
                {
                  new: true,
                }
            );
            result.ok == 1 ? resolve('success') : reject(error);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  };
  const postnotification = ({payload, token}) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {user, content} = payload;
        const expirytimefromtoken = await decodetoken.decodejwt(token);
        if (Date.now() > expirytimefromtoken) {
          resolve('tokenexpired');
        } else {
          const savenotification = new Notification({
            user,
            content,
          });
          const result = await savenotification.save();
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  };
  const getnotification = ({payload, token}) => {
    return new Promise(async (resolve, reject) => {
      try {
        // payload containing user objectid and _id of getting notification
        const {user, _id} = payload;
        const expirytimefromtoken = await decodetoken.decodejwt(token);
        if (Date.now() > expirytimefromtoken) {
          resolve('tokenexpired');
        } else {
          let found;
          const result = await Notification.find({user: user});
          // console.log(result);
          // finding out particular notification out of many notifications of the user.
          if (_id) {
            for (let i = 0; i < result.length; i++) {
              if (result[i]._id == _id) {
                found = result[i];
              }
            }
            if (found) {
              found = await found.updateOne(
                  {
                    seen_status: true,
                  },
                  {
                    new: true,
                  }
              );
              found.ok == 1
                ? resolve(await Notification.find({user}))
                : resolve('error');
            } else {
              resolve('Error');
            }
          } else {
            resolve(result);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const getuserticket = ({payload, token}) => {
    return new Promise(async (resolve, reject) => {
      try {
        // payload containing user objectid and _id of getting notification
        const {creater_id} = payload;
        const expirytimefromtoken = await decodetoken.decodejwt(token);
        if (Date.now() > expirytimefromtoken) {
          resolve('tokenexpired');
        } else {
          const result = await Ticket.find({created_by: creater_id}).populate(
              'message',
              {
                _id: 0,
                created_at: 1,
                message: 1,
                senders: 1,
              }
          );
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  };
  const getescalationmanager = ({token}) => {
    return new Promise(async (resolve, reject) => {
      try {
        // payload containing user objectid and _id of getting notification

        const expirytimefromtoken = await decodetoken.decodejwt(token);
        if (Date.now() > expirytimefromtoken) {
          resolve('tokenexpired');
        } else {
          const result = await User.find(
              {userType: 'hr'},
              {email: 1, userType: 1, userid: 1, companyname: 1}
          );
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  };
  const postManager = ({token, payload}) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {manager_id, esclation_manager} = payload;
        // payload containing user objectid and _id of getting notification
        const expirytimefromtoken = await decodetoken.decodejwt(token);
        if (Date.now() > expirytimefromtoken) {
          resolve('tokenexpired');
        } else {
          const savemanager = new Manager({
            esclation_manager_id: manager_id,
            level: esclation_manager,
          });
          result = await savemanager.save();
          // let result;
          // if (esclation_manager == 'esclation_manager_1') {
          //   const manager = new Manager({esclation_manager_1: manager_id});
          //   result = await manager.save();
          // }
          // if (esclation_manager == 'esclation_manager_2') {
          //   const manager = new Manager({esclation_manager_2: manager_id});
          //   result = await manager.save();
          // }
          // if (esclation_manager == 'esclation_manager_3') {
          //   const manager = new Manager({esclation_manager_3: manager_id});
          //   result = await manager.save();
          // }

          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  };
  const getManager = ({token}) => {
    return new Promise(async (resolve, reject) => {
      try {
        // payload containing user objectid and _id of getting notification
        const expirytimefromtoken = await decodetoken.decodejwt(token);
        if (Date.now() > expirytimefromtoken) {
          resolve('tokenexpired');
        } else {
          const result = await Manager.find({}, {_id: 0, __v: 0}).populate(
              'esclation_manager_id',
              {
                email: 1,
                userType: 1,
                userid: 1,
                companyname: 1,
              }
          );
          // .populate('esclation_manager_2', {
          //   email: 1,
          //   userType: 1,
          //   userid: 1,
          //   companyname: 1,
          // })
          // .populate('esclation_manager_3', {
          //   email: 1,
          //   userType: 1,
          //   userid: 1,
          //   companyname: 1,
          // });
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  return {
    postTicket,
    getTicket,
    postmessage,
    getmessage,
    escalate,
    ticketstatus,
    updatemanager,
    postnotification,
    getnotification,
    getuserticket,
    getescalationmanager,
    postManager,
    getManager,
  };
};
