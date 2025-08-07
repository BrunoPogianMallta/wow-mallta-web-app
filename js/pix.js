// Função chamada ao clicar em "Comprar"
async function comprarItem(itemId, nomeItem, valor, emailComprador) {
  try {
    const response = await fetch('http://127.0.0.1:2000/api/pix/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valor: valor.toFixed(2), // valor em reais, ex: 10.00
        comprador: {
          nome: 'Bruno Mallta', // opcional
          email: emailComprador
        },
        referencia: `item-${itemId}`,
        descricao: `Compra de ${nomeItem}`
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao gerar QR Code Pix');
    }

    // Exibir QR Code e payload no HTML
    document.getElementById('qrcode-img').src = data.qrCodeImage;
    document.getElementById('pix-code').textContent = data.payload;
    document.getElementById('pix-area').style.display = 'block';

  } catch (err) {
    alert('Erro: ' + err.message);
  }
}
