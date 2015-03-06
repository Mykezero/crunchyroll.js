'use strict';
export = main;
import childProcess = require('child_process');
import fs = require('fs');
import path = require('path');
import os = require('os');
import subtitle = require('../subtitle/index');
import typings = require('../typings');

/**
 * Merges the subtitle and video files into a Matroska Multimedia Container.
 */
function main(config: typings.IConfig, isSubtitled: boolean, rtmpInputPath: string, filePath: string, done: (err: Error) => void) {
  var subtitlePath = filePath + '.' + (subtitle.formats[config.format] ? config.format : 'ass');
  var videoPath = filePath + path.extname(rtmpInputPath);
  childProcess.exec(command() + ' ' +
    '-o "' + filePath + '.mkv" ' +
    '"' + videoPath + '" ' +
    (isSubtitled ? '"' + subtitlePath + '"' : ''), {
      maxBuffer: Infinity
    }, err => {
      if (err) return done(err);
      unlink(videoPath, subtitlePath, err => {
        if (err) unlinkTimeout(videoPath, subtitlePath, 5000);
        done(null);
      });
    });
}

/**
 * Determines the command for the operating system.
 */
function command(): string {
  if (os.platform() !== 'win32') return 'mkvmerge';
  return '"' + path.join(__dirname, '../../bin/mkvmerge.exe') + '"';
}

/**
 * Unlinks the video and subtitle.
 * @private
 */
function unlink(videoPath: string, subtitlePath: string, done: (err: Error) => void) {
  fs.unlink(videoPath, err => {
    if (err) return done(err);
    fs.unlink(subtitlePath, done);
  });
}

/**
 * Attempts to unlink the video and subtitle with a timeout between each try.
 */
function unlinkTimeout(videoPath: string, subtitlePath: string, timeout: number) {
  setTimeout(() => {
    unlink(videoPath, subtitlePath, err => {
      if (err) unlinkTimeout(videoPath, subtitlePath, timeout);
    });
  }, timeout);
}