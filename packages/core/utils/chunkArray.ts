export const chunkArray = (array: any[], chunkSize: number): any[][] => {
    const chunks: any[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };