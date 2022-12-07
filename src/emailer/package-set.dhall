let upstream = https://github.com/dfinity/vessel-package-set/releases/download/mo-0.6.21-20220215/package-set.dhall sha256:b46f30e811fe5085741be01e126629c2a55d4c3d6ebf49408fb3b4a98e37589b
let Package =
    { name : Text, version : Text, repo : Text, dependencies : List Text }

let additions = [
    { 
        name = "json", 
        repo = "https://github.com/aviate-labs/json.mo", 
        version = "master", 
        dependencies = ["base", "parser-combinators"]
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

in  upstream # additions # overrides
