#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var ffbinaries_1 = require("ffbinaries");
var axios = require("axios");
var program = require("commander");
var child_process_1 = require("child_process");
var path_1 = require("path");
program
    .arguments("<presetSpec> <inputFilePath>")
    .action(function (presetSpec, inputFilePath) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, repo, filename, specUrl, specContents, parsedFilename, replacements, args;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, ensureBinaries()];
            case 1:
                _b.sent();
                _a = presetSpec.split("/"), username = _a[0], repo = _a[1], filename = _a[2];
                specUrl = "https://raw.githubusercontent.com/" + username + "/" + repo + "/master/" + filename;
                return [4 /*yield*/, axios["default"].get(specUrl)];
            case 2:
                specContents = (_b.sent())
                    .data;
                parsedFilename = path_1.parse(inputFilePath);
                replacements = Object.entries({
                    input: inputFilePath,
                    inputFilename: parsedFilename.name,
                    inputBasename: parsedFilename.base
                }).sort(function (_a, _b) {
                    var keyA = _a[0];
                    var keyB = _b[0];
                    return keyB.length - keyA.length;
                });
                args = specContents.args.map(function (arg) {
                    return replacements.reduce(function (argValue, _a) {
                        var key = _a[0], value = _a[1];
                        return argValue.replace("$" + key, value);
                    }, arg);
                });
                child_process_1.spawn("./.bin/ffmpeg", args, { stdio: "inherit" });
                return [2 /*return*/];
        }
    });
}); });
program.parse(process.argv);
function ensureBinaries() {
    return new Promise(function (resolve) {
        ffbinaries_1.downloadBinaries({ destination: "./.bin" }, function () { return resolve(); });
    });
}
