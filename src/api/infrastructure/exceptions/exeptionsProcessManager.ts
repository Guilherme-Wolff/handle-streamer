let ERRO_MESSAGE_LIVE_EXIST = 'live is already being saved'

class customError extends Error {
  public mensagem:string = ''
  public status:string|number = 5151;
  
  constructor(mensagem: string,status:string|number) {
    super(mensagem);
    this.mensagem = mensagem;
    this.status = status;

    // Captura o rastreamento de pilha (stack trace)
    Error.captureStackTrace(this, customError);
  }
}


export const Error_Live_exists = new customError(ERRO_MESSAGE_LIVE_EXIST,5151)
