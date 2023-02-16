let base = https://github.com/internet-computer/base-package-set/releases/download/moc-0.7.4/package-set.dhall sha256:3a20693fc597b96a8c7cf8645fda7a3534d13e5fbda28c00d01f0b7641efe494
let Package = { name : Text, version : Text, repo : Text, dependencies : List Text }

let additions = [
    { 
      name = "mo-table", 
      repo = "https://github.com/av1ctor/mo-table", 
      version = "v0.1.0", 
      dependencies = ["base"]
    },
    { 
        name = "json", 
        repo = "https://github.com/aviate-labs/json.mo", 
        version = "master", 
        dependencies = ["base", "parser-combinators"]
    },
    {
        name = "sha256",
        repo = "https://github.com/enzoh/motoko-sha",
        version = "master",
        dependencies = ["base"]
    },
    { 
        name = "parser-combinators", 
        repo = "https://github.com/aviate-labs/parser-combinators.mo", 
        version = "v0.1.0", 
        dependencies = ["base"]
    }      
] : List Package

let overrides = [
    {
        name = "base",
        repo = "https://github.com/dfinity/motoko-base",
        version = "master",
        dependencies = [] : List Text
    }
] : List Package

in  base # additions # overrides
