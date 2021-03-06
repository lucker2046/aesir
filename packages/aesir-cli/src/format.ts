import * as R from 'ramda'
import * as prettier from 'prettier'
import * as Fs from 'fs'
import * as ora from 'ora'
import { debugCheck as debugCheckLib } from './external-lib/clean-ast'
import { filesArray } from './lib/constraint'
import { prettierConfig } from './lib/config';

export class Format {
  private formatConfig: any

  constructor(config) {
    this.formatConfig = config
  }

  private debugCheck (files) {
    return debugCheckLib(this.formatConfig, files)
  }
  
  public fileNeedCheck (fileName:string):boolean {
    const file = Fs.readFileSync(fileName, 'utf8')
    const result =  prettier.check(file, this.formatConfig)
    return !result
  }
  
  public listDifference (files:filesArray):filesArray {
    const filter = R.filter(this.fileNeedCheck.bind(this))
    const result = filter(files)
    return result
  }
  
  public debugCheckFilter (files:filesArray):filesArray {
    const me = this
    const filter = R.filter(fileName => {
      const file = Fs.readFileSync(fileName, 'utf8')
      return !me.debugCheck.call(me, file)
    })
    return filter(files)
  }
  
  public safetyFilter (files:filesArray):filesArray {
    const me = this
    const filter = R.compose(R.filter(function (fileName) {
      const file = Fs.readFileSync(fileName, 'utf8')
      return me.debugCheck.call(me, file)
    }), this.listDifference.bind(this))
    
    return filter(files)
  }
  
  public format (files:filesArray):filesArray {
    const spinner = ora('format file')
    const formatOneFile = (fileName:string) => {
      spinner.text = `format file - ${fileName}`
      const file:string = Fs.readFileSync(fileName, 'utf8')
      const formatFile:string = prettier.format(file, this.formatConfig)
      Fs.writeFileSync(fileName, formatFile, {
        encoding: 'utf8'
      })
    }
    spinner.start()
    R.forEach(formatOneFile)(files)
    spinner.succeed(`格式化文件完毕`)
    return files
  }
}

export function formatStr(originFile:string):string{
  return prettier.format(originFile, prettierConfig)
}