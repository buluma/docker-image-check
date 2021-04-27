#!/usr/bin/env node

'use strict'

const got = require('got')
const _ = require('lodash')
const semver = require('semver')

const commmand = process.argv[2]
const repo = process.argv[3]
let compareTag = process.argv[4]

const sanitizeTag = (tag) => {
  let sourceTag = tag
  if (tag.indexOf('v') === 0) {
    tag = tag.substr(1)
  }

  if (tag.indexOf('-') > -1) {
    let split = tag.split('-')
    tag = split[0]
  }

  return tag
}

let highestUnsanitized
const getHighest = () => {
  return got.get(`https://hub.docker.com/v2/repositories/${repo}/tags/?page=1&page_size=250`, {json: true}).then(res => {
    let tags = _.map(res.body.results, 'name')

    let highestTag = '0.0.0'
    _.each(tags, tag => {
      let unsanitizedTag = tag
      tag = sanitizeTag(tag)

      if (semver.valid(tag)) {
        if (semver.gt(tag, highestTag)) {
          highestTag = tag
          highestUnsanitized = unsanitizedTag
        }
      } else {
        // console.info(`Tag "${tag}" is invalid!`)
      }
    })

    return highestTag === '0.0.0' ? false : highestTag
  })
}

switch(commmand) {
  case 'highest':
    if (!compareTag) {
      console.info('\nUsage:   dic highest       REPO         TAG')
      console.info('Example: dic highest beevelop/nodejs  v1.2.3')
      process.exit(0)
    }

    getHighest().then(highestTag => {
      let compareTagSanitized = sanitizeTag(compareTag)
      if (highestTag === compareTagSanitized) {
        console.info(`✅  ${highestTag} is the highest tag available`)
      } else {
        console.info(`⚠️  ${compareTag} is lower than ${highestUnsanitized}`)
      }
    })
}
