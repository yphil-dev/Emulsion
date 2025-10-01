{
  "targets": [
    {
      "target_name": "gamecontroller",
      "sources": [ "gamecontroller.cc" ],
      "libraries": [ "-lSDL2" ],
      "conditions": [
        ["OS=='mac'", { "libraries": [ "-framework Cocoa" ] }]
      ]
    }
  ]
}
