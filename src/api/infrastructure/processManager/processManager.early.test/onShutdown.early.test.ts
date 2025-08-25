// Unit tests for: onShutdown

import { LivesManager } from "../processManager";

// Mocking necessary imports
jest.mock("child_process");
jest.mock("fs");
jest.mock("axios");
jest.mock("node-fetch");
jest.mock("../../../application/services/upload.bunkr.service.js");
jest.mock("../../../application/services/uploader.pixeldrain.service.js");
jest.mock("../../../application/services/uploader.jsonblob.service.js");
jest.mock("../../../application/services/chat.service.js");
jest.mock("uuid");
jest.mock("../../../application/config/index.js");
jest.mock("tsyringe");
jest.mock("../../../application/services/savelive.service.js");
jest.mock("../../../application/services/lives.service.js");
jest.mock("../../../application/services/streamers.service.js");
jest.mock("../../../domain/entities/lives.entity.js");
jest.mock("../../../application/services/thumbnail.service.js");
jest.mock("../../../application/services/get_proxies.js");
jest.mock("../PROXIE_BUCKET.js");
jest.mock("os");

// Mock interfaces and classes
interface MockProcess {
  id: string;
  streamer: string;
  platform: string;
}

interface MockProcessStart {
  id: string;
  streamer: string;
  platform: string;
  process: any;
}

class MockStreamersService {
  returnStreamersToDatabase = jest.fn();
}

describe("LivesManager.onShutdown() onShutdown method", () => {
  let livesManager: LivesManager;
  let mockStreamersService: MockStreamersService;

  beforeEach(() => {
    mockStreamersService = new MockStreamersService() as any;
    livesManager = new LivesManager() as any;
    livesManager.StreamersService = mockStreamersService as any;
  });

  describe("Happy Paths", () => {
    it("should handle shutdown gracefully with no processes", async () => {
      // Test description: Ensure onShutdown handles the case with no processes gracefully.
      livesManager.RequestCentralProcess.clear();
      livesManager.OnlineCentralProcess.clear();

      await livesManager.onShutdown();

      expect(
        mockStreamersService.returnStreamersToDatabase,
      ).toHaveBeenCalledWith([]);
    });

    it("should handle shutdown with offline processes", async () => {
      // Test description: Ensure onShutdown handles the case with offline processes.
      const mockProcess: MockProcess = {
        id: "1",
        streamer: "streamer1",
        platform: "platform1",
      } as any;
      livesManager.RequestCentralProcess.set("1", mockProcess as any);

      await livesManager.onShutdown();

      expect(
        mockStreamersService.returnStreamersToDatabase,
      ).toHaveBeenCalledWith(["streamer1"]);
    });

    it("should handle shutdown with online processes", async () => {
      // Test description: Ensure onShutdown handles the case with online processes.
      const mockProcessStart: MockProcessStart = {
        id: "1",
        streamer: "streamer2",
        platform: "platform2",
        process: {},
      } as any;
      livesManager.OnlineCentralProcess.set("1", mockProcessStart as any);

      await livesManager.onShutdown();

      expect(
        mockStreamersService.returnStreamersToDatabase,
      ).toHaveBeenCalledWith(["streamer2"]);
    });

    it("should handle shutdown with both online and offline processes", async () => {
      // Test description: Ensure onShutdown handles the case with both online and offline processes.
      const mockProcess: MockProcess = {
        id: "1",
        streamer: "streamer1",
        platform: "platform1",
      } as any;
      const mockProcessStart: MockProcessStart = {
        id: "2",
        streamer: "streamer2",
        platform: "platform2",
        process: {},
      } as any;
      livesManager.RequestCentralProcess.set("1", mockProcess as any);
      livesManager.OnlineCentralProcess.set("2", mockProcessStart as any);

      await livesManager.onShutdown();

      expect(
        mockStreamersService.returnStreamersToDatabase,
      ).toHaveBeenCalledWith(["streamer1", "streamer2"]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle shutdown when StreamersService throws an error", async () => {
      // Test description: Ensure onShutdown handles errors from StreamersService gracefully.
      mockStreamersService.returnStreamersToDatabase.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(livesManager.onShutdown()).rejects.toThrow("Database error");
    });

    it("should handle shutdown when process exit is called", async () => {
      // Test description: Ensure onShutdown calls process.exit.
      const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});

      await livesManager.onShutdown();

      expect(exitSpy).toHaveBeenCalledWith(0);
      exitSpy.mockRestore();
    });
  });
});

// End of unit tests for: onShutdown
