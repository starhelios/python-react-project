syntax on
filetype plugin indent on

set shortmess=a
nnoremap <C-h> <C-w>h
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k
nnoremap <C-l> <C-w>l

let &t_Co=256
colorscheme solarized
set background=dark
set ls=2
set number 
set autoindent
set shiftwidth=4
set tabstop=4
set softtabstop=4
set expandtab
set backspace=indent,eol,start
map <F6> :tabp<cr>
map <F7> :tabn<cr>
:nnoremap <Leader>s :%s/\<<C-r><C-w>\>
nmap <PageUp> gT
nmap <PageDown> gt
nmap <Left> gT
nmap <Right> gt

filetype on 

if has("gui_running")
  if has("gui_gtk2")
    set guifont=Inconsolata\ 12
  elseif has("gui_macvim")
    set guifont=Menlo\ Regular:h18
  elseif has("gui_win32")
    set guifont=Consolas:h11:cANSI
  endif
endif

autocmd FileType html setlocal shiftwidth=2 tabstop=2 softtabstop=2
autocmd FileType javascript setlocal shiftwidth=2 tabstop=2 softtabstop=2
autocmd BufNewFile,BufRead *.pug setlocal shiftwidth=2 tabstop=2 softtabstop=2
autocmd FileType c,cpp,python,javascript,lua,html autocmd BufWritePre <buffer> %s/\s\+$//e
nnoremap gp `[v`]
