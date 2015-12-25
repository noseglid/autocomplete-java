# autocomplete-java

Autocomplete-plus provider for Java. Features:

* Complete package and class names
* Import classes
* Organize imports (TODO)
* Examine public methods and variables of a class and use them as snippets
* Intelligent suggestions (remembers previous selections)
* Refresh class description automatically on save (after compile)
* Refresh all class descriptions manually with the refresh command

![Screenshot](https://f.cloud.github.com/assets/69169/2290250/c35d867a-a017-11e3-86be-cd7c5bf3ff9b.gif)

## Usage

Configure classpath via a .classpath file that is placed at the root directory of your project. For example:

    ./src:./classes:./lib/*

Alter autocomplete behavior with settings.

NOTE: There should be only one package that compiles classes, and other plugins should rely on that. Therefore this package does not compile classes from source. Use linter-javac or some other package/tool for compiling. Preferably all classes should be compiled first on project load, and then each class separately on save.

## Status

Tested on OS X. Probably works ok on some Linux distributions also. Does not support Windows yet.

TODO:
* Organize imports
* Screenshot
* Support for Windows
* Testing on Linux
* Unit tests
* Optimize 'load class members'
* Clean old class members on refresh
* Support for multiple root folders
* Support for symlinks
* Fuzzy search
* More intelligent determination of type (currently just a simple hack)
