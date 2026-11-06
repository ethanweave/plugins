import { createController } from './controller.mjs';
import { createRuntimeHost } from './runtime-host.mjs';

// A page's host is the OpenCode v1 { id, server } form. The static page owns
// the user-facing settings; this background host only keeps the watcher bound
// to the plugin's current registry entry and saved options.
export default {
  id: 'claude-desktop-zh',
  async server(input, options = {}) {
    const controller = createController(options);
    const runtime = createRuntimeHost(input, options, controller);
    void runtime.start();
    return {};
  }
};
