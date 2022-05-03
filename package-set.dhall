let upstream = https://github.com/dfinity/vessel-package-set/releases/download/mo-0.6.21-20220215/package-set.dhall sha256:b46f30e811fe5085741be01e126629c2a55d4c3d6ebf49408fb3b4a98e37589b
let Package =
    { name : Text, version : Text, repo : Text, dependencies : List Text }

let additions = [
    { 
      name = "mo-table", 
      repo = "file:///home/v1ctor/mo-table", 
      version = "v0.1.0", 
      dependencies = ["base"]
   }      
] : List Package

{- This is where you can override existing packages in the package-set
    For example, if you wanted to use version `v2.0.0` of the foo library:
    let overrides = [
        { name = "foo"
        , version = "v2.0.0"
        , repo = "https://github.com/bar/foo"
        , dependencies = [] : List Text
        }
    ]
-}
let overrides =
    [] : List Package

in  upstream # additions # overrides
