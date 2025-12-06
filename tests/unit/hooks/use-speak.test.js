import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSpeak } from '../../../src/hooks/speak/use-speak.js';
import { StandalonePluginSystem } from '../../../src/system/standalone-plugin-system.js';

describe('useSpeak', () => {
  let system;
  let ctx;
  let api;
  let subsystem;

  beforeEach(() => {
    system = new StandalonePluginSystem('test', {
      config: {
        speak: {
          prefix: '[Test] ',
          debug: false
        }
      }
    });
    ctx = system.ctx;
    api = system.api;
    subsystem = system;
  });

  describe('hook execution', () => {
    it('should create a speak facet', () => {
      const facet = useSpeak(ctx, api, subsystem);
      expect(facet).toBeDefined();
      expect(facet.getKind()).toBe('speak');
    });

    it('should have say method', () => {
      const facet = useSpeak(ctx, api, subsystem);
      expect(typeof facet.say).toBe('function');
    });

    it('should have sayLine method', () => {
      const facet = useSpeak(ctx, api, subsystem);
      expect(typeof facet.sayLine).toBe('function');
    });
  });

  describe('speaking functionality', () => {
    it('should say a message', () => {
      const facet = useSpeak(ctx, api, subsystem);
      const output = vi.fn();
      const customCtx = {
        ...ctx,
        config: {
          ...ctx.config,
          speak: {
            output,
            prefix: '[Test] '
          }
        }
      };
      const customFacet = useSpeak(customCtx, api, subsystem);
      
      customFacet.say('Hello');
      
      expect(output).toHaveBeenCalledWith('[Test] Hello');
    });

    it('should say a line with newline', () => {
      const output = vi.fn();
      const customCtx = {
        ...ctx,
        config: {
          ...ctx.config,
          speak: {
            output,
            prefix: '[Test] '
          }
        }
      };
      const facet = useSpeak(customCtx, api, subsystem);
      
      facet.sayLine('Hello, World!');
      
      expect(output).toHaveBeenCalledWith('[Test] Hello, World!');
    });

    it('should use custom output function if provided', () => {
      const customOutput = vi.fn();
      const customCtx = {
        ...ctx,
        config: {
          ...ctx.config,
          speak: {
            output: customOutput,
            prefix: ''
          }
        }
      };
      
      const facet = useSpeak(customCtx, api, subsystem);
      facet.say('Test');
      
      expect(customOutput).toHaveBeenCalledWith('Test');
    });

    it('should throw error if message is not a string', () => {
      const facet = useSpeak(ctx, api, subsystem);
      
      expect(() => facet.say(123)).toThrow('speak.say() requires a string message');
      expect(() => facet.sayLine(null)).toThrow('speak.sayLine() requires a string message');
    });

    it('should use empty prefix if not configured', () => {
      const output = vi.fn();
      const noPrefixCtx = {
        ...ctx,
        config: {
          speak: {
            output
          }
        }
      };
      
      const facet = useSpeak(noPrefixCtx, api, subsystem);
      
      facet.say('Hello');
      
      expect(output).toHaveBeenCalledWith('Hello');
    });
  });

  describe('integration with system', () => {
    it('should work when added to a system', async () => {
      await system.use(useSpeak).build();
      
      expect(system.speak).toBeDefined();
      expect(typeof system.speak.say).toBe('function');
      expect(typeof system.speak.sayLine).toBe('function');
    });

    it('should allow speaking messages', async () => {
      const output = vi.fn();
      const customSystem = new StandalonePluginSystem('test', {
        config: {
          speak: {
            output,
            prefix: '[Test] '
          }
        }
      });
      
      await customSystem.use(useSpeak).build();
      
      customSystem.speak.say('Hello');
      customSystem.speak.sayLine('World!');
      
      expect(output).toHaveBeenCalledWith('[Test] Hello');
      expect(output).toHaveBeenCalledWith('[Test] World!');
      
      await customSystem.dispose();
    });
  });
});

