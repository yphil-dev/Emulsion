#include <node.h>
#include <SDL2/SDL.h>
#include <iostream>

namespace Controller {

  using v8::Function;
  using v8::FunctionCallbackInfo;
  using v8::Value;
  using v8::Local;
  using v8::Object;

  SDL_GameController* controller = nullptr;
  bool backPressed = false;
  bool dpadDownPressed = false;

  void Init(const FunctionCallbackInfo<Value>& args) {
    SDL_Init(SDL_INIT_GAMECONTROLLER);
    SDL_GameControllerEventState(SDL_ENABLE);
  }

  void PollEvents(const FunctionCallbackInfo<Value>& args) {
    SDL_Event event;
    while(SDL_PollEvent(&event)) {
      if(event.type == SDL_CONTROLLERBUTTONDOWN) {
        if(event.cbutton.button == SDL_CONTROLLER_BUTTON_BACK) {
          backPressed = true;
        }
        if(event.cbutton.button == SDL_CONTROLLER_BUTTON_DPAD_DOWN) {
          dpadDownPressed = true;
        }

        if(backPressed && dpadDownPressed) {
          std::cout << "COMBO PRESSED! (Back + Dpad Down)" << std::endl;
        }
      }

      if(event.type == SDL_CONTROLLERBUTTONUP) {
        if(event.cbutton.button == SDL_CONTROLLER_BUTTON_BACK) {
          backPressed = false;
        }
        if(event.cbutton.button == SDL_CONTROLLER_BUTTON_DPAD_DOWN) {
          dpadDownPressed = false;
        }
      }
    }
  }

  void Shutdown(const FunctionCallbackInfo<Value>& args) {
    if(controller) SDL_GameControllerClose(controller);
    SDL_Quit();
  }

  void Initialize(Local<Object> exports) {
    NODE_SET_METHOD(exports, "init", Init);
    NODE_SET_METHOD(exports, "poll", PollEvents);
    NODE_SET_METHOD(exports, "shutdown", Shutdown);
  }

  NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)

} // namespace Controller
