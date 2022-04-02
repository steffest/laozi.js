# Laozi.js

Node.js version of Laozi, the Super Simple Instant API

## Princicles of this node version
 - No dependencies
 - No build step
 - Vanilla JS

## Install and run
 -> `node server.js` 
when running on IISNODE on a Windows server, there's a web.config file in the docs/iisnode folder
 
## Laozi Background
Laozi is a super simple drop in API providing basic CRUD for "structured content".  
Data Storage can be anything a there's a stong preference to use filebased storage for it's simplicity and zero-setup.  
"Structured content" defined a loose structure of an "article", for example
 - title
 - body
 - main image
 - date
 - author
 - slug

Laozi then renders a the list/detail/edit screens and provides a REST bast API for retreiving this content in JSON format with basic filtering/ordering.  
This is the node.js version. There's also a version in PHP, .NET and Classic ASP. (yes, it goes way back)
