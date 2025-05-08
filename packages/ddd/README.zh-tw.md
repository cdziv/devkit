[English](https://github.com/cdziv/devkit/blob/main/packages/ddd/README.md) | 繁體中文

# 介紹

@cdziv/devkit-ddd 協助您在程式實作面實現領域驅動設計(DDD)，建構領域知識清晰、易讀、易維護、可擴展的應用。它不依賴任何框架、ORM，可以按需使用於您的應用中。

> **提示**： 此文件假設您對 DDD 有基本概念，若尚未暸解 DDD 以及不知道是否該引入至您的應用中，[Eric Evans 的《領域驅動設計》](https://www.domainlanguage.com/ddd/)是很好的開始。

## 快速起步

在這個章節中，我們將在使用這個函式庫的核心功能，在領域層實作一個簡單的撲克遊戲範例。

### 安裝

```bash
npm install @cdziv/devkit-ddd
```

### 值物件

首先，玩家需要一個使用者名稱、籌碼堆。我們將使用者名稱設計為一個值物件：

```ts
// 建立一個值為 DomainPrimitive 的值物件
type UsernameValue = string;
class Username extends ValueObject<UsernameValue> {
  // 必須實作驗證方法
  validate(value: UsernameValue): ValidationResult {
    if (value.length < 3 || value.length > 30) {
      return false;
    }
    return true;
  }
}

expect(new Username('john_lennon').value).toBe('john_lennon');
```

在實例化時傳入一個合法的值，透過 `value` 屬性取得該值。如果傳入的值沒有通過驗證將拋出錯誤：

```ts
const username = new Username('john_lennon');
expect(username.value).toBe('john_lennon');

const invalidName = '';
expect(() => new Username(invalidName)).toThrow(ArgumentInvalidError);
```

接下來，我們將籌碼堆也設計為一個值物件。籌碼堆有餘額、下注數兩個屬性，我們使用 `ChipCount` 作為這兩個屬性的值，將領域不變量邏輯封裝在 `ChipCount` 中，所以我們不需要擔心它們是否為正整數。另外，我們也定義了一些行為使用了 `evolve` 更新它們的值：

```ts
type ChipCountValue = number;
class ChipCount extends ValueObject<ChipCountValue> {
  add(count: ChipCount): ChipCount {
    return this.evolve(this.value + count.value);
  }

  subtract(count: ChipCount): ChipCount {
    if (count.value > this.value) {
      throw new DddError('Not enough chips');
    }
    // Another usage of evolve
    return this.evolve((originalValue) => originalValue - count.value);
  }

  validate(value: ChipCountValue): ValidationResult {
    if (value < 0 || !Number.isInteger(value)) {
      return false;
    }
    return true;
  }
}

type StackValue = {
  balance: ChipCount;
  bet: ChipCount;
};
class Stack extends ValueObject<StackValue> {
  raise(count: ChipCount): Stack {
    if (this.value.balance.value < count.value) {
      throw new DddError('Not enough balance');
    }
    // Another usage of evolve
    return this.evolve((originalValue) => ({
      balance: originalValue.balance.subtract(count),
      bet: originalValue.bet.add(count),
    }));
  }

  win(count: ChipCount): Stack {
    // Another usage of evolve
    return this.evolve({
      balance: this.value.balance.add(count),
      bet: new ChipCount(0),
    });
  }

  pay(): Stack {
    // Another usage of evolve
    return this.evolve('bet', new ChipCount(0));
  }

  validate(value: StackValue): ValidationResult {
    if (
      !(value.balance instanceof ChipCount) ||
      !(value.bet instanceof ChipCount)
    ) {
      return false;
    }
    return true;
  }
}
```

請注意，此函式庫將所有領域物件設計為不可變的，所以 evolve 會返回一個全新的值物件而不是自身。這讓領域物件的實體永遠符合領域不變量，因為實例化的過程會呼叫 validate 方法，只要您能成功建立該物件——不論是創建、持久還原、還是透過 `evolve`——您必須維護其領域不變性，否則，就應該拋出錯誤。

您可以使用 equals 方法來比對兩個值物件的值是否相等：

```ts
const chipCount = new ChipCount(100);
const updatedChipCount = chipCount.add(0);
expect(updatedChipCount).not.toBe(chipCount);
expect(updatedChipCount.equals(chipCount)).toBe(true);
```

### 實體/聚合根

現在，是時候來設計玩家物件了。玩家具有唯一識別符，應該被設計為一個實體而非值物件。在撲克遊戲中，玩家不僅應該維護內部狀態的領域不變量，需要加注、喊牌、等待外部事件進行行動而改變內部狀態，就像一個窗口般，因此我們將它設計為聚合根。

聚合根需要定義一個 ID：

```ts
class UUID extends EntityId<string> {
  // 必須實作 rawId getter
  get rawId(): string {
    return this.value;
  }

  // ... 實作內容 ...
}

type PlayerProps = {
  id: UUID;
  username: Username;
  stack: Stack;
  folded: boolean;
};
class Player extends AggregateRoot<PlayerProps, UUID> {
  // 必須實作 id getter
  get id(): UUID {
    return this.props.id;
  }

  fold() {
    return this.evolve('folded', true);
  }

  validate(props: PlayerProps): ValidationResult {
    // ... 實作內容 ...
  }
}
```

透過 `props` 取得實體/聚合根的屬性，而 `equals` 只比對 `id` 是否相同，並不會深入比較屬性。

```ts
const playerProps = {
  id: new UUID(randomUUID()),
  username: new UserName('john_lennon'),
  stack: new Stack({
    balance: new ChipCount(100),
    bet: new ChipCount(0),
  }),
  folded: false,
};
const player = new Player(playerProps);

const updatedPlayer = player.fold();

expect(player).toEqual(playerAProps);
expect(player.equals(updatedPlayer)).toBe(true);
```

### 領域事件

遊戲中，玩家的行為必須被其他玩家接收到以利進行接下來的行動，所以我們定義領域事件：

> **提示：** 為了讓領域事件能輕鬆地在服務之間傳遞，例如訊息佇列系統，其屬性應該保持可序列化的。所以我們不直接傳入一個值物件作為聚合根 ID ，而是傳入單純的字串。

```ts
class PlayerFolded extends DomainEvent {}
class PlayerChecked extends DomainEvent {}

type PlayerRaisedPayload = {
  amount: number;
};
class PlayerRaised extends DomainEvent<PlayerRaisedPayload> {
  constructor(aggregateId: string, amount: number) {
    super({
      aggregateId,
      amount,
    });
  }
}
```

接著，在玩家行為中加入它們：

```ts
class Player extends AggregateRoot<PlayerProps, UUID> {
  // ... 實作內容 ...

  fold() {
    const event = new PlayerFolded(this.id.rawId);
    return this.evolve('folded', true).addEvent(event);
  }

  check() {
    const event = new PlayerChecked(this.id.rawId);
    return this.addEvent(event);
  }

  raise(count: ChipCount) {
    const event = new PlayerRaised(this.id.rawId);
    return this.evolve('stack', stack.raise(count)).addEvent(event);
  }

  // ... 實作內容 ...
}
```

當領域事件伴隨聚合根行為被創建，在「確實發生」時——例如成功持久化——聚合根便可以發布收集在自身的領域事件，進入事件系統：

```ts
const playerProps = {
  // ... 實作屬性 ...
};
let player = new Player(playerProps);
player = player.fold();
player.events; // [PlayerFolded]

// 持久化狀態
await playerRepository.save(player);
// 發布領域事件
player.publishEvents(eventEmitter);
```

### toJSON 方法

不論是資料持久化、遠端呼叫或是回應客戶端，都會需要將領域物件轉換成可序列化格式，`toJSON` 遞迴地將值/屬性轉換成一個 JSON 物件：

> **提示：** 您應該盡量避免將領域模型直接洩漏到應用外部，而是轉換成數據傳述對象（DTO）或是視圖模型（View Model）。

```ts
const playerProps = {
  id: new UUID('5d56961c-7794-47f5-9332-d96997351069'),
  username: new UserName('john_lennon'),
  stack: new Stack({
    balance: new ChipCount(100),
    bet: new ChipCount(0),
  }),
  folded: false,
};
const player = new Player(playerProps);
const expectedJSON = {
  id: '5d56961c-7794-47f5-9332-d96997351069',
  username: 'john_lennon',
  stack: {
    balance: 100,
    bet: 0,
  },
  folded: false,
};

expect(player.toJSON()).toEqual(expectedJSON);
```
