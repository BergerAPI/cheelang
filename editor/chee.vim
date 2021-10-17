" Usage Instructions
" Put this file in .vim/syntax/chee.vim
" and add in your .vimrc file the next line:
" autocmd BufRead,BufNewFile *.chee set filetype=chee

if exists("b:current_syntax")
  finish
endif

" Language keywords
syntax keyword cheeKeywords if else true false while func return external

syntax match cheeFunctionCall '\%([^[:cntrl:][:space:][:punct:][:digit:]]\|_\)\%([^[:cntrl:][:punct:][:space:]]\|_\)*\ze\%(\s*(\)'

syntax match cheeNumber '\d\+' contained display
syntax match cheeNumber '[-+]\d\+' contained display

syntax match cheeNumber '\d\+\.\d*' contained display
syntax match cheeNumber '[-+]\d\+\.\d*' contained display

syntax match cheeNumber '[-+]\=\d[[:digit:]]*[eE][\-+]\=\d\+' contained display
syntax match cheeNumber '\d[[:digit:]]*[eE][\-+]\=\d\+' contained display

syntax match cheeNumber '[-+]\=\d[[:digit:]]*\.\d*[eE][\-+]\=\d\+' contained display
syntax match cheeNumber '\d[[:digit:]]*\.\d*[eE][\-+]\=\d\+' contained display

" Comments
syntax region cheeCommentLine start=";" end="$"

syntax region cheeString start=/\v"/ skip=/\v\\./ end=/\v"/
syntax region cheeString start=/\v'/ skip=/\v\\./ end=/\v'/

highlight default link cheeKeywords Identifier
highlight default link cheeCommentLine Comment
highlight default link cheeString String
highlight default link cheeNumber Float
highlight default link cheeFunctionCall Function 
highlight default link cheeVariableDeclaration Variable

let b:current_syntax = "chee"