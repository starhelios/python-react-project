export const MathpixStyle = `
    #setText p {
        justify-content: inherit;
    }
    g[data-mml-node="mover"] svg {
        overflow: visible !important;
    }
    .math-inline mjx-container {
        display: inline-block !important;
    }
    .math-block {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: inherit;
        min-width: min-content;
    }
    .math-block p {
        flex-shrink: 1;
    }
    .math-block mjx-container {
        margin: 0 !important;
    }
    .math-error {
        background-color: yellow;
        color: red;
    }
    .equation-number {
        padding-left: 30px;
    }
    
    img {
        max-width: 100%;
    }
    
    blockquote {
        color: #666;
        margin: 0;
        padding-left: 3em;
        border-left: .5em solid #eee;
    }
    
    pre {
        border: 1px solid #ccc;
    }
    .empty {
        text-align: center;
        font-size: 18px;
        padding: 50px 0 !important;
    }
    
`;
