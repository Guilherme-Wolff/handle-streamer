// Unit tests for: userImageUploaderBunkr

import fetch from "node-fetch";
import { UploaderService } from "../uploader.imgbb.service";

jest.mock("node-fetch");
jest.mock("form-data");

const { Response } = jest.requireActual("node-fetch");



describe("UploaderService.userImageUploaderBunkr() userImageUploaderBunkr method", () => {

  const IMGBB_CLIENT_API_KEY = '713bcfdb3686407e86c8061d80f78369'


  const urlUpload = `https://api.imgbb.com/1/upload?key=${IMGBB_CLIENT_API_KEY}`

  let uploaderService: UploaderService;

  beforeEach(() => {
    uploaderService = new UploaderService();
  });

  describe("Happy Path", () => {
    it("should successfully upload an image and return the correct URL", async () => {
      // Arrange
      const mockImageUrl = "https://static-cdn.jtvnw.net/jtv_user_pictures/257b79a2-3082-4a8a-8c9d-7a0415a9f080-profile_image-50x50.png";
      const mockResponseData = {
        success: true,
        data: {
          url: urlUpload,
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponseData), { status: 200 }),
      );

      // Act
      const result = await uploaderService.userImageUploaderBunkr(mockImageUrl);
      const url = result.url as string

      // Assert
      expect(result.sucess).toBe(true);
      expect(result.url).toBe(url.includes(".jpg"));
    });
  });

  describe("Edge Cases", () => {
    it("should handle a non-200 response from the image URL fetch", async () => {
      // Arrange
      const mockImageUrl = "https://static-cdn.jtvnw.net/jtv_user_pictures/257b79a2-3082-4a8a-8c9d-7a0415a9f080-profile_image-50x50.png";

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        new Response(null, { status: 404, statusText: "Not Found" }),
      );

      // Act
      const result = await uploaderService.userImageUploaderBunkr(mockImageUrl);

      // Assert
      expect(result.sucess).toBe(false);
      expect(result.url).toBe("");
    });

    it("should handle a failed upload response", async () => {
      // Arrange
      const mockImageUrl = "https://static-cdn.jtvnw.net/jtv_user_pictures/257b79a2-3082-4a8a-8c9d-7a0415a9f080-profile_image-50x50.png";
      const mockResponseData = {
        success: false,
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponseData), { status: 200 }),
      );

      // Act
      const result = await uploaderService.userImageUploaderBunkr(mockImageUrl);

      // Assert
      expect(result.sucess).toBe(false);
      expect(result.url).toBe("");
    });

    it("should handle an error during the fetch process", async () => {
      // Arrange
      const mockImageUrl = "https://static-cdn.jtvnw.net/jtv_user_pictures/257b79a2-3082-4a8a-8c9d-7a0415a9f080-profile_image-50x50.png";

      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error("Network error"),
      );

      // Act
      const result = await uploaderService.userImageUploaderBunkr(mockImageUrl);

      // Assert
      expect(result.sucess).toBe(false);
      expect(result.url).toBe("");
    });
  });
});

// End of unit tests for: userImageUploaderBunkr
