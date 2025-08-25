/**
 * Custom exceptions handler, mostly used at the validation step in the controller layer.
 */
export default class ExceptionHandler extends Error {
  constructor(
    public statusCode: number,
    public message: any
  ) {
    super()
    console.error(`Exception raised --> statusCode: ${statusCode} message: ${message}`)
  }
}