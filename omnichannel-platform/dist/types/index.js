"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SenderType = exports.ConversationStatus = exports.ChannelType = exports.UserRole = void 0;
// Enums para os tipos de dados
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["AGENT"] = "AGENT";
    UserRole["SUPERVISOR"] = "SUPERVISOR";
})(UserRole || (exports.UserRole = UserRole = {}));
var ChannelType;
(function (ChannelType) {
    ChannelType["WHATSAPP"] = "WHATSAPP";
    ChannelType["WEBCHAT"] = "WEBCHAT";
})(ChannelType || (exports.ChannelType = ChannelType = {}));
var ConversationStatus;
(function (ConversationStatus) {
    ConversationStatus["BOT"] = "BOT";
    ConversationStatus["QUEUED"] = "QUEUED";
    ConversationStatus["OPEN"] = "OPEN";
    ConversationStatus["CLOSED"] = "CLOSED";
})(ConversationStatus || (exports.ConversationStatus = ConversationStatus = {}));
var SenderType;
(function (SenderType) {
    SenderType["CUSTOMER"] = "CUSTOMER";
    SenderType["BOT"] = "BOT";
    SenderType["AGENT"] = "AGENT";
})(SenderType || (exports.SenderType = SenderType = {}));
//# sourceMappingURL=index.js.map